import { base64ToBytes } from "../socket-io.js";
/** CDP screencast capture as a pipeline plugin. Rides the same CDP
 *  connection the client uses; no second WebSocket to the provider. */
export class ScreencastCapturePlugin {
    opts;
    name = "screencast-capture";
    maxInFlight;
    targets = new Map();
    frames = [];
    droppedFrames = 0;
    duplicatesSkipped = 0;
    totalBytes = 0;
    capStopped = false;
    truncationReason = null;
    stopSignalListener = null;
    started = false;
    chunkIndex = 0;
    chunkBuffer = [];
    chunkBufferBytes = 0;
    chunkOpenedAt = 0;
    pendingWrites = new Set();
    constructor(opts) {
        this.opts = opts;
        this.maxInFlight = opts.maxInFlightChunks ?? 8;
    }
    async onSessionStart(state) {
        const meta = {
            sessionId: this.opts.sessionId,
            providerId: this.opts.providerId,
            profileId: this.opts.profileId,
            startedAt: Date.now(),
            frameCount: 0,
            sizeBytes: 0,
            complete: false,
            format: this.opts.format,
        };
        await this.opts.storage.init(this.opts.sessionId, meta);
        this.chunkOpenedAt = Date.now();
        this.started = true;
        state.sendInternalOneWay("Target.setAutoAttach", {
            autoAttach: true,
            waitForDebuggerOnStart: false,
            flatten: true,
        });
        // Don't block startup on Target.getTargets — auto-attach delivers new
        // target events regardless, and existing targets get picked up when
        // their attach event fires.
        void this.probeExistingTargets(state);
        this.armStopSignal(state);
    }
    armStopSignal(state) {
        const signal = this.opts.stopSignal;
        if (!signal)
            return;
        if (signal.aborted) {
            this.stopCapture(state, extractAbortReason(signal));
            return;
        }
        const listener = () => this.stopCapture(state, extractAbortReason(signal));
        this.stopSignalListener = listener;
        signal.addEventListener("abort", listener, { once: true });
    }
    detachStopSignal() {
        if (this.stopSignalListener !== null && this.opts.stopSignal) {
            this.opts.stopSignal.removeEventListener("abort", this.stopSignalListener);
            this.stopSignalListener = null;
        }
    }
    stopCapture(state, reason) {
        if (this.capStopped)
            return;
        this.capStopped = true;
        this.truncationReason = reason;
        this.detachStopSignal();
        for (const t of this.targets.values()) {
            state.sendInternalOneWay("Page.stopScreencast", {}, t.cdpSessionId);
        }
    }
    async probeExistingTargets(state) {
        try {
            const list = await state.sendInternal("Target.getTargets");
            for (const ti of list.targetInfos ?? []) {
                if (ti.type === "page" || ti.type === "iframe") {
                    state.sendInternalOneWay("Target.attachToTarget", { targetId: ti.targetId, flatten: true });
                }
            }
        }
        catch (err) {
            this.opts.logger?.("replay: Target.getTargets failed", {
                sessionId: this.opts.sessionId,
                err: err instanceof Error ? err.message : String(err),
            });
        }
    }
    onEvent(msg, state) {
        if (!this.started || this.capStopped)
            return;
        if (msg.method === "Target.attachedToTarget") {
            const params = msg.params;
            const ti = params?.targetInfo;
            const cdpSessionId = params?.sessionId;
            if (ti && cdpSessionId && (ti.type === "page" || ti.type === "iframe")) {
                this.armTarget(state, cdpSessionId, ti.targetId);
            }
            return;
        }
        if (msg.method === "Target.detachedFromTarget") {
            const params = msg.params;
            if (params?.sessionId)
                this.targets.delete(params.sessionId);
            return;
        }
        if (msg.method === "Page.frameNavigated" && msg.sessionId) {
            const params = msg.params;
            if (params?.frame && !params.frame.parentId && params.frame.url) {
                const target = this.targets.get(msg.sessionId);
                if (target)
                    target.lastUrl = params.frame.url;
            }
            return;
        }
        if (msg.method === "Page.screencastFrame" && msg.sessionId) {
            this.handleScreencastFrame(state, msg);
            return null;
        }
    }
    async onSessionEnd(state, _reason) {
        if (!this.started)
            return;
        this.detachStopSignal();
        if (!this.capStopped) {
            for (const t of this.targets.values()) {
                state.sendInternalOneWay("Page.stopScreencast", {}, t.cdpSessionId);
            }
        }
        this.flushChunk();
        await Promise.allSettled(Array.from(this.pendingWrites));
        const manifest = {
            sessionId: this.opts.sessionId,
            format: this.opts.format,
            targets: Array.from(this.targets.values()).map((t) => t.targetId),
            frames: this.frames,
            truncated: this.truncationReason,
        };
        await this.opts.storage.finalize(this.opts.sessionId, manifest, {
            endedAt: Date.now(),
            frameCount: this.frames.length,
            sizeBytes: this.totalBytes,
            droppedFrames: this.droppedFrames,
            duplicatesSkipped: this.duplicatesSkipped,
            truncated: this.truncationReason,
        });
    }
    armTarget(state, cdpSessionId, targetId) {
        if (this.targets.has(cdpSessionId))
            return;
        this.targets.set(cdpSessionId, {
            targetId,
            cdpSessionId,
            frameCount: 0,
            sizeBytes: 0,
        });
        const w = this.opts.viewportWidth ?? 1280;
        const h = this.opts.viewportHeight ?? 720;
        state.sendInternalOneWay("Page.enable", {}, cdpSessionId);
        // must ack before Page.startScreencast — puppeteer/puppeteer#10527
        void state
            .sendInternal("Page.setDeviceMetricsOverride", {
            width: w,
            height: h,
            deviceScaleFactor: this.opts.deviceScaleFactor ?? 1,
            mobile: false,
        }, cdpSessionId)
            .then(() => state.sendInternal("Page.startScreencast", {
            format: this.opts.format,
            quality: this.opts.quality,
            everyNthFrame: this.opts.everyNthFrame,
            maxWidth: w,
            maxHeight: h,
        }, cdpSessionId))
            .catch((err) => {
            this.opts.logger?.("screencast arm failed", {
                targetId,
                err: err instanceof Error ? err.message : String(err),
            });
        });
    }
    handleScreencastFrame(state, msg) {
        const cdpSessionId = msg.sessionId;
        const target = this.targets.get(cdpSessionId);
        if (!target)
            return;
        const params = msg.params;
        state.sendInternalOneWay("Page.screencastFrameAck", { sessionId: params.sessionId }, cdpSessionId);
        if (this.totalBytes >= this.opts.maxBytesPerSession) {
            if (!this.capStopped) {
                this.opts.logger?.("replay: per-session byte cap reached, stopping capture", {
                    sessionId: this.opts.sessionId,
                    totalBytes: this.totalBytes,
                });
                this.stopCapture(state, "byte-cap");
            }
            return;
        }
        if (this.opts.filterEmptyUrl && !target.lastUrl) {
            this.duplicatesSkipped++;
            return;
        }
        if (this.pendingWrites.size >= this.maxInFlight) {
            this.droppedFrames++;
            return;
        }
        const bytes = base64ToBytes(params.data);
        const hash = fnv1a32(bytes);
        if (target.lastFrameHash === hash) {
            this.duplicatesSkipped++;
            return;
        }
        target.lastFrameHash = hash;
        this.appendFrameToBuffer(target, bytes, params.metadata ?? {});
    }
    appendFrameToBuffer(target, bytes, metadata) {
        const now = Date.now();
        if (this.chunkBufferBytes > 0 &&
            (this.chunkBufferBytes + bytes.length + 4 > this.opts.chunkMaxBytes ||
                now - this.chunkOpenedAt > this.opts.chunkMaxElapsedMs)) {
            this.flushChunk();
        }
        const byteOffset = this.chunkBufferBytes;
        const prefix = new Uint8Array(4);
        new DataView(prefix.buffer).setUint32(0, bytes.length, false);
        this.chunkBuffer.push(prefix, bytes);
        this.chunkBufferBytes += 4 + bytes.length;
        if (this.chunkBufferBytes === 4 + bytes.length)
            this.chunkOpenedAt = now;
        const record = {
            frame: this.frames.length + 1,
            ts: metadata.timestamp ? Math.round(metadata.timestamp * 1000) : now,
            url: target.lastUrl ?? "",
            deviceWidth: metadata.deviceWidth ?? 0,
            deviceHeight: metadata.deviceHeight ?? 0,
            scrollX: metadata.scrollOffsetX ?? 0,
            scrollY: metadata.scrollOffsetY ?? 0,
            sizeBytes: bytes.length,
            targetId: target.targetId,
            chunkIndex: this.chunkIndex,
            byteOffset,
            length: bytes.length,
        };
        this.frames.push(record);
        target.frameCount++;
        target.sizeBytes += bytes.length;
        this.totalBytes += bytes.length;
    }
    flushChunk() {
        if (this.chunkBufferBytes === 0)
            return;
        const data = concatBytes(this.chunkBuffer, this.chunkBufferBytes);
        const chunkIndex = this.chunkIndex;
        const write = this.opts.storage
            .writeChunk(this.opts.sessionId, chunkIndex, data)
            .catch((err) => {
            this.opts.logger?.("replay: writeChunk failed", {
                sessionId: this.opts.sessionId,
                chunkIndex,
                err: err instanceof Error ? err.message : String(err),
            });
        });
        this.pendingWrites.add(write);
        write.finally(() => this.pendingWrites.delete(write));
        this.chunkIndex++;
        this.chunkBuffer = [];
        this.chunkBufferBytes = 0;
        this.chunkOpenedAt = 0;
    }
}
function extractAbortReason(signal) {
    const raw = signal.reason;
    if (typeof raw === "string" && raw.length > 0)
        return raw;
    return "external-stop";
}
function fnv1a32(bytes) {
    let h = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
        h ^= bytes[i];
        h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h;
}
function concatBytes(chunks, total) {
    const out = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) {
        out.set(c, off);
        off += c.length;
    }
    return out;
}
//# sourceMappingURL=screencast-capture.js.map