import { ClientMessageSchema, } from "../../live-client/protocol.js";
import { base64ToBytes, listen } from "../socket-io.js";
/** Same-tab hijack: forces `target=_blank` links, `window.open`, and forms
 *  submitted with `target=_blank` to stay in the viewer's tab. Without this
 *  every popup opens a target the viewer never sees. */
const SAME_TAB_SCRIPT = "(()=>{document.addEventListener('click',e=>{const a=e.target&&e.target.closest&&e.target.closest('a[target=\"_blank\"]');if(a)a.target='_self';},true);" +
    "document.addEventListener('submit',e=>{const f=e.target;if(f&&f.target&&String(f.target).toLowerCase()==='_blank')f.target='_self';},true);" +
    "try{window.open=(u)=>{if(u)location.href=String(u);return null;};}catch(_){}})();";
const DEFAULTS = {
    format: "jpeg",
    quality: 60,
    viewportWidth: 1280,
    viewportHeight: 720,
    everyNthFrame: 2,
    deviceScaleFactor: 1,
    dropThresholdBytes: 1_000_000,
    keepAliveSeconds: 0,
};
/** CDP screencast → viewer socket bridge as a pipeline plugin. Creates a
 *  fresh `about:blank` target on session start, attaches to it, and pumps
 *  screencast frames to a viewer WebSocket. Accepts viewer input messages
 *  (mouse / key / navigate / setViewport / paste / close) and dispatches
 *  them upstream via `state.sendInternal`. Works in Node (with `ws`) and
 *  Cloudflare Workers (with the platform WebSocket) — both conform to the
 *  {@link PipelineSocket} contract. */
export class ScreencastBridgePlugin {
    name = "screencast-bridge";
    opts;
    cdpSessionId = null;
    targetId = null;
    stateRef = null;
    closed = false;
    framesSent = 0;
    framesDropped = 0;
    lastMeta = null;
    expireTimer = null;
    warnTimer = null;
    viewerAttached = false;
    constructor(opts) {
        this.opts = {
            viewer: opts.viewer,
            format: opts.format ?? DEFAULTS.format,
            quality: opts.quality ?? DEFAULTS.quality,
            viewportWidth: opts.viewportWidth ?? DEFAULTS.viewportWidth,
            viewportHeight: opts.viewportHeight ?? DEFAULTS.viewportHeight,
            everyNthFrame: opts.everyNthFrame ?? DEFAULTS.everyNthFrame,
            deviceScaleFactor: opts.deviceScaleFactor ?? DEFAULTS.deviceScaleFactor,
            dropThresholdBytes: opts.dropThresholdBytes ?? DEFAULTS.dropThresholdBytes,
            keepAliveSeconds: opts.keepAliveSeconds ?? DEFAULTS.keepAliveSeconds,
            logger: opts.logger,
        };
    }
    getStats() {
        return { framesSent: this.framesSent, framesDropped: this.framesDropped };
    }
    /** Exposed so other plugins (e.g. profile inject) can piggy-back on the
     *  same attached target. `null` until `onSessionStart` completes. */
    getSessionId() {
        return this.cdpSessionId;
    }
    async onSessionStart(state) {
        this.stateRef = state;
        const created = await state.sendInternal("Target.createTarget", {
            url: "about:blank",
        });
        this.targetId = created.targetId;
        const attached = await state.sendInternal("Target.attachToTarget", {
            targetId: this.targetId,
            flatten: true,
        });
        this.cdpSessionId = attached.sessionId;
        await state.sendInternal("Page.enable", {}, this.cdpSessionId);
        state.sendInternalOneWay("Storage.clearCookies", {});
        state.sendInternalOneWay("Page.addScriptToEvaluateOnNewDocument", { source: SAME_TAB_SCRIPT }, this.cdpSessionId);
        // must run before Page.startScreencast — puppeteer/puppeteer#10527
        await state.sendInternal("Page.setDeviceMetricsOverride", {
            width: this.opts.viewportWidth,
            height: this.opts.viewportHeight,
            deviceScaleFactor: this.opts.deviceScaleFactor,
            mobile: false,
        }, this.cdpSessionId);
        await state.sendInternal("Page.startScreencast", {
            format: this.opts.format,
            quality: this.opts.quality,
            maxWidth: this.opts.viewportWidth,
            maxHeight: this.opts.viewportHeight,
            everyNthFrame: this.opts.everyNthFrame,
        }, this.cdpSessionId);
        this.attachViewer(state);
        if (this.opts.keepAliveSeconds > 0)
            this.startKeepAliveTimers(state);
    }
    onEvent(msg, state) {
        if (this.closed)
            return;
        if (msg.method === "Page.screencastFrame" && msg.sessionId === this.cdpSessionId) {
            this.handleScreencastFrame(state, msg);
            return null;
        }
        if (msg.method === "Page.frameNavigated" && msg.sessionId === this.cdpSessionId) {
            const params = msg.params;
            if (params?.frame && !params.frame.parentId && params.frame.url) {
                this.sendControl({ type: "url", url: params.frame.url });
            }
        }
    }
    async onSessionEnd(state, _reason) {
        this.closed = true;
        if (this.expireTimer) {
            clearTimeout(this.expireTimer);
            this.expireTimer = null;
        }
        if (this.warnTimer) {
            clearTimeout(this.warnTimer);
            this.warnTimer = null;
        }
        if (this.cdpSessionId) {
            state.sendInternalOneWay("Page.stopScreencast", {}, this.cdpSessionId);
            state.sendInternalOneWay("Target.detachFromTarget", { sessionId: this.cdpSessionId });
        }
        if (this.targetId) {
            state.sendInternalOneWay("Target.closeTarget", { targetId: this.targetId });
        }
        try {
            this.opts.viewer.close(1000, "stream ended");
        }
        catch { /* already closed */ }
    }
    handleScreencastFrame(state, msg) {
        const p = msg.params;
        state.sendInternalOneWay("Page.screencastFrameAck", { sessionId: p.sessionId }, this.cdpSessionId ?? undefined);
        this.maybeSendFrameMeta(p.metadata);
        this.forwardFrame(p.data);
    }
    maybeSendFrameMeta(metadata) {
        const next = {
            deviceWidth: metadata.deviceWidth ?? 0,
            deviceHeight: metadata.deviceHeight ?? 0,
            scrollX: metadata.scrollOffsetX ?? 0,
            scrollY: metadata.scrollOffsetY ?? 0,
        };
        if (this.lastMeta &&
            this.lastMeta.deviceWidth === next.deviceWidth &&
            this.lastMeta.deviceHeight === next.deviceHeight &&
            this.lastMeta.scrollX === next.scrollX &&
            this.lastMeta.scrollY === next.scrollY) {
            return;
        }
        this.lastMeta = next;
        this.sendControl({ type: "frameMeta", ...next });
    }
    forwardFrame(base64Data) {
        const viewer = this.opts.viewer;
        const buffered = viewer.bufferedAmount ?? 0;
        if (buffered > this.opts.dropThresholdBytes) {
            this.framesDropped++;
            return;
        }
        try {
            viewer.send(base64ToBytes(base64Data));
            this.framesSent++;
        }
        catch { /* best-effort — viewer probably closed, finalize fires from close event */ }
    }
    sendControl(msg) {
        try {
            this.opts.viewer.send(JSON.stringify(msg));
        }
        catch { /* best-effort */ }
    }
    attachViewer(state) {
        if (this.viewerAttached)
            return;
        this.viewerAttached = true;
        const viewer = this.opts.viewer;
        listen(viewer, "message", (evt) => {
            const data = extractText(evt);
            if (data === undefined)
                return;
            this.handleViewerMessage(state, data);
        });
        listen(viewer, "close", () => state.close("viewer-closed"));
        listen(viewer, "error", () => state.close("viewer-error"));
    }
    handleViewerMessage(state, text) {
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch {
            return;
        }
        const result = ClientMessageSchema.safeParse(parsed);
        if (!result.success) {
            this.opts.logger?.("live: rejected invalid viewer message", {
                issues: result.error.issues.slice(0, 3),
            });
            return;
        }
        void this.dispatchClientMessage(state, result.data);
    }
    async dispatchClientMessage(state, msg) {
        if (!this.cdpSessionId)
            return;
        try {
            switch (msg.type) {
                case "mouse":
                    await state.sendInternal("Input.dispatchMouseEvent", {
                        type: msg.event.kind === "press" ? "mousePressed"
                            : msg.event.kind === "release" ? "mouseReleased"
                                : msg.event.kind === "wheel" ? "mouseWheel"
                                    : "mouseMoved",
                        x: msg.event.x,
                        y: msg.event.y,
                        button: msg.event.button ?? "left",
                        buttons: !msg.event.button || msg.event.button === "none" ? 0 : 1,
                        clickCount: msg.event.clickCount ?? (msg.event.kind === "press" || msg.event.kind === "release" ? 1 : 0),
                        modifiers: msg.event.modifiers ?? 0,
                        ...(msg.event.kind === "wheel"
                            ? { deltaX: msg.event.deltaX ?? 0, deltaY: msg.event.deltaY ?? 0 }
                            : {}),
                    }, this.cdpSessionId);
                    break;
                case "key":
                    await state.sendInternal("Input.dispatchKeyEvent", {
                        type: msg.event.kind === "down" ? "keyDown"
                            : msg.event.kind === "up" ? "keyUp"
                                : "char",
                        ...(msg.event.text !== undefined ? { text: msg.event.text, unmodifiedText: msg.event.text.toLowerCase() } : {}),
                        ...(msg.event.code ? { code: msg.event.code } : {}),
                        ...(msg.event.key ? { key: msg.event.key } : {}),
                        ...(msg.event.keyCode !== undefined
                            ? { windowsVirtualKeyCode: msg.event.keyCode, nativeVirtualKeyCode: msg.event.keyCode }
                            : {}),
                        modifiers: msg.event.modifiers ?? 0,
                        autoRepeat: false,
                        isKeypad: false,
                        isSystemKey: false,
                    }, this.cdpSessionId);
                    break;
                case "navigate":
                    if (msg.url) {
                        await state.sendInternal("Page.navigate", { url: msg.url }, this.cdpSessionId);
                    }
                    else if (msg.action === "reload") {
                        await state.sendInternal("Page.reload", {}, this.cdpSessionId);
                    }
                    else if (msg.action === "back" || msg.action === "forward") {
                        const hist = await state.sendInternal("Page.getNavigationHistory", {}, this.cdpSessionId);
                        const targetIdx = hist.currentIndex + (msg.action === "back" ? -1 : 1);
                        const entry = hist.entries[targetIdx];
                        if (entry) {
                            await state.sendInternal("Page.navigateToHistoryEntry", { entryId: entry.id }, this.cdpSessionId);
                        }
                    }
                    break;
                case "setViewport":
                    await state.sendInternal("Page.setDeviceMetricsOverride", {
                        width: msg.width,
                        height: msg.height,
                        deviceScaleFactor: msg.deviceScaleFactor ?? 1,
                        mobile: msg.mobile ?? false,
                    }, this.cdpSessionId);
                    this.opts.viewportWidth = msg.width;
                    this.opts.viewportHeight = msg.height;
                    state.sendInternalOneWay("Page.stopScreencast", {}, this.cdpSessionId);
                    await state.sendInternal("Page.startScreencast", {
                        format: this.opts.format,
                        quality: this.opts.quality,
                        maxWidth: msg.width,
                        maxHeight: msg.height,
                        everyNthFrame: this.opts.everyNthFrame,
                    }, this.cdpSessionId);
                    break;
                case "paste":
                    await state.sendInternal("Input.insertText", { text: msg.text }, this.cdpSessionId);
                    break;
                case "close":
                    state.close("viewer-requested-close");
                    break;
            }
        }
        catch (err) {
            this.opts.logger?.("live: error dispatching viewer message", {
                type: msg.type,
                err: err instanceof Error ? err.message : String(err),
            });
        }
    }
    startKeepAliveTimers(state) {
        const totalMs = this.opts.keepAliveSeconds * 1000;
        const warnAtMs = Math.max(0, totalMs - 30_000);
        if (warnAtMs > 0) {
            this.warnTimer = setTimeout(() => {
                this.sendControl({ type: "expiring", secondsRemaining: 30 });
            }, warnAtMs);
        }
        this.expireTimer = setTimeout(() => {
            this.sendControl({ type: "expired" });
            state.close("keep-alive-expired");
        }, totalMs);
    }
}
function extractText(evt) {
    if (evt === null || evt === undefined)
        return undefined;
    if (typeof evt === "string")
        return evt;
    const asEvent = evt;
    const d = asEvent && "data" in asEvent ? asEvent.data : evt;
    if (typeof d === "string")
        return d;
    if (d instanceof ArrayBuffer)
        return new TextDecoder().decode(d);
    if (ArrayBuffer.isView(d))
        return new TextDecoder().decode(d);
    if (d && typeof d.toString === "function")
        return String(d);
    return undefined;
}
//# sourceMappingURL=screencast-bridge.js.map