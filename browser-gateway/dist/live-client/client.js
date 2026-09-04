/**
 * Browser-side client for the gateway's `/v1/live` WebSocket.
 *
 * Protocol shape lives in `./protocol.ts`. Both OSS gateway dashboard and the
 * SaaS cloud playground import this class — one implementation, zero drift.
 *
 * Server→client: binary WS frames carry JPEG bytes; JSON text frames carry
 * control messages (`frameMeta`, `url`, `error`). Client→server: JSON text
 * frames for mouse / key / navigate / close / setViewport / paste.
 *
 * No automatic reconnect. If the connection dies the UI surfaces the error
 * and the user reconnects manually.
 */
const MODIFIER_ALT = 1;
const MODIFIER_CTRL = 2;
const MODIFIER_META = 4;
const MODIFIER_SHIFT = 8;
export class LiveClient {
    ws = null;
    currentMeta = null;
    listeners;
    closed = false;
    constructor(listeners) {
        this.listeners = listeners;
    }
    connect(opts) {
        if (this.ws)
            throw new Error("LiveClient already connected");
        const wsBase = opts.wsBase ?? deriveWsBase();
        const params = new URLSearchParams({ provider: opts.provider });
        if (opts.profile)
            params.set("profile", opts.profile);
        if (opts.readOnly)
            params.set("readOnly", "1");
        if (opts.token) {
            // SaaS router auth uses `?key=`; OSS uses `?token=`. Send both so a
            // single client works against either gateway. The server that doesn't
            // recognize a param just ignores it.
            params.set("key", opts.token);
            params.set("token", opts.token);
        }
        if (opts.format)
            params.set("format", opts.format);
        if (opts.quality !== undefined)
            params.set("quality", String(opts.quality));
        if (opts.maxWidth !== undefined)
            params.set("maxWidth", String(opts.maxWidth));
        if (opts.maxHeight !== undefined)
            params.set("maxHeight", String(opts.maxHeight));
        if (opts.everyNthFrame !== undefined)
            params.set("everyNthFrame", String(opts.everyNthFrame));
        if (opts.keepAliveSeconds !== undefined)
            params.set("keepAlive", String(opts.keepAliveSeconds));
        const url = `${wsBase}/v1/live?${params.toString()}`;
        const ws = new WebSocket(url);
        ws.binaryType = "arraybuffer";
        this.ws = ws;
        ws.addEventListener("open", () => {
            if (this.closed)
                return;
            this.listeners.onOpen();
        });
        ws.addEventListener("message", (ev) => {
            if (this.closed)
                return;
            if (ev.data instanceof ArrayBuffer) {
                void this.handleBinaryFrame(ev.data);
            }
            else if (typeof ev.data === "string") {
                this.handleControlMessage(ev.data);
            }
        });
        ws.addEventListener("error", () => {
            // 'error' is opaque in browsers — the close event that follows carries
            // the useful info.
        });
        ws.addEventListener("close", (ev) => {
            if (this.closed)
                return;
            this.closed = true;
            this.listeners.onClose({ code: ev.code, reason: ev.reason });
            this.ws = null;
        });
    }
    isProcessingFrame = false;
    pendingFrameBuffer = null;
    pendingFrameDropped = 0;
    handleBinaryFrame(buffer) {
        if (this.isProcessingFrame) {
            if (this.pendingFrameBuffer)
                this.pendingFrameDropped++;
            this.pendingFrameBuffer = buffer;
            return;
        }
        this.isProcessingFrame = true;
        void this.drainFrames(buffer);
    }
    async drainFrames(first) {
        try {
            await this.decodeAndDeliver(first);
            while (this.pendingFrameBuffer) {
                const next = this.pendingFrameBuffer;
                this.pendingFrameBuffer = null;
                await this.decodeAndDeliver(next);
            }
        }
        finally {
            this.isProcessingFrame = false;
        }
    }
    async decodeAndDeliver(buffer) {
        try {
            const blob = new Blob([buffer], { type: "image/jpeg" });
            const bitmap = await createImageBitmap(blob);
            const meta = this.currentMeta ?? {
                deviceWidth: bitmap.width,
                deviceHeight: bitmap.height,
                scrollX: 0,
                scrollY: 0,
            };
            this.listeners.onFrame(bitmap, meta);
        }
        catch {
            // Decoder failure on one frame shouldn't kill the stream.
        }
    }
    handleControlMessage(text) {
        let msg;
        try {
            msg = JSON.parse(text);
        }
        catch {
            return;
        }
        if (msg.type === "frameMeta" &&
            typeof msg.deviceWidth === "number" &&
            typeof msg.deviceHeight === "number") {
            this.currentMeta = {
                deviceWidth: msg.deviceWidth,
                deviceHeight: msg.deviceHeight,
                scrollX: msg.scrollX ?? 0,
                scrollY: msg.scrollY ?? 0,
            };
            return;
        }
        if (msg.type === "url" && typeof msg.url === "string") {
            this.listeners.onUrl(msg.url);
            return;
        }
        if (msg.type === "error") {
            this.listeners.onError(msg.code ?? "UNKNOWN", msg.message ?? "");
            return;
        }
        if (msg.type === "expiring" && typeof msg.secondsRemaining === "number") {
            this.listeners.onExpiring?.(msg.secondsRemaining);
            return;
        }
        if (msg.type === "expired") {
            this.listeners.onExpired?.();
            return;
        }
    }
    isOpen() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    getMeta() {
        return this.currentMeta;
    }
    sendMouse(opts) {
        this.send({ type: "mouse", event: opts });
    }
    sendKey(opts) {
        this.send({ type: "key", event: opts });
    }
    /** Paste text into the focused field on the remote page. Uses CDP
     *  Input.insertText (one shot, no per-character key dispatch). Server caps
     *  length at 64 KB. */
    sendPaste(text) {
        if (!text)
            return;
        this.send({ type: "paste", text: text.slice(0, 64_000) });
    }
    navigate(url) {
        this.send({ type: "navigate", url });
    }
    navAction(action) {
        this.send({ type: "navigate", action });
    }
    setViewport(width, height) {
        this.send({ type: "setViewport", width, height });
    }
    close() {
        if (this.closed)
            return;
        this.closed = true;
        try {
            this.ws?.close(1000);
        }
        catch {
            /* ignore */
        }
        this.ws = null;
    }
    send(obj) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        try {
            this.ws.send(JSON.stringify(obj));
        }
        catch {
            // best-effort
        }
    }
}
function deriveWsBase() {
    if (typeof window === "undefined")
        return "ws://localhost:9500";
    const scheme = window.location.protocol === "https:" ? "wss" : "ws";
    // OSS dev-mode: dashboard on :9501 → gateway on :9500.
    const host = window.location.host.includes("9501")
        ? window.location.host.replace("9501", "9500")
        : window.location.host;
    return `${scheme}://${host}`;
}
/**
 * Convert a browser KeyboardEvent / MouseEvent / WheelEvent into the modifier
 * bitmask CDP expects. Exported so consumers can reuse it for both keydown and
 * mousedown paths.
 */
export function eventModifiers(e) {
    let mask = 0;
    if (e.altKey)
        mask |= MODIFIER_ALT;
    if (e.ctrlKey)
        mask |= MODIFIER_CTRL;
    if (e.metaKey)
        mask |= MODIFIER_META;
    if (e.shiftKey)
        mask |= MODIFIER_SHIFT;
    return mask;
}
/** Map a DOM `MouseEvent.button` (0/1/2) to our protocol button name. */
export function mouseButton(button) {
    if (button === 1)
        return "middle";
    if (button === 2)
        return "right";
    return "left";
}
//# sourceMappingURL=client.js.map