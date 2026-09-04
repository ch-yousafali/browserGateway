import { withTimeout } from "../core/profile/cdp-utils.js";
import { InternalIdSpace } from "./id-space.js";
import { SessionStateImpl } from "./session-state.js";
import { listen } from "./socket-io.js";
const DEFAULT_ON_SESSION_START_TIMEOUT_MS = 15_000;
const DEFAULT_ON_SESSION_END_TIMEOUT_MS = 15_000;
const DEFAULT_DROP_THRESHOLD_BYTES = 1_000_000;
/** CDP-aware bidirectional relay. Two-phase lifecycle:
 *  1. {@link Pipeline.start} — attaches the upstream side, runs every
 *     plugin's `onSessionStart`. Fails fast if any plugin errors; the
 *     upstream is closed and no `onSessionEnd` runs. Callers use this to
 *     probe whether the provider can serve the session before committing
 *     to a client upgrade — enables failover.
 *  2. {@link Pipeline.run} — attaches the client (or runs solo), pumps
 *     bytes, runs `onSessionEnd` for every plugin on close. */
export class Pipeline {
    client = null;
    upstream;
    plugins;
    logger;
    onSessionStartTimeoutMs;
    onSessionEndTimeoutMs;
    dropThresholdBytes;
    maxSessionMs;
    idleTimeoutMs;
    onActivity;
    activityThrottleMs;
    lastReportedActivityAt = 0;
    ids = new InternalIdSpace();
    state;
    counters = {
        bytesIn: 0,
        bytesOut: 0,
        messageCount: 0,
        parsedCount: 0,
        droppedByPlugin: 0,
        injectedCount: 0,
    };
    started = false;
    closed = false;
    lastClientActivityAt = Date.now();
    maxTimer = null;
    idleTimer = null;
    resolveResult = null;
    constructor(upstream, upstreamUrl, opts) {
        this.upstream = upstream;
        this.plugins = opts.plugins;
        this.logger = opts.logger ?? (() => { });
        this.onSessionStartTimeoutMs = opts.onSessionStartTimeoutMs ?? DEFAULT_ON_SESSION_START_TIMEOUT_MS;
        this.onSessionEndTimeoutMs = opts.onSessionEndTimeoutMs ?? DEFAULT_ON_SESSION_END_TIMEOUT_MS;
        this.dropThresholdBytes = opts.dropThresholdBytes ?? DEFAULT_DROP_THRESHOLD_BYTES;
        this.maxSessionMs = opts.maxSessionMs;
        this.idleTimeoutMs = opts.idleTimeoutMs;
        this.onActivity = opts.onActivity;
        this.activityThrottleMs = opts.activityThrottleMs ?? 60_000;
        this.state = new SessionStateImpl(upstreamUrl);
        this.state.sendInternal = (method, params, sessionId) => {
            const { id, promise } = this.ids.allocate();
            const msg = sessionId ? { id, method, params, sessionId } : { id, method, params };
            this.counters.injectedCount++;
            try {
                this.upstream.send(JSON.stringify(msg));
            }
            catch (err) {
                this.ids.settle(id, { error: { code: -1, message: err instanceof Error ? err.message : String(err) } });
            }
            return promise;
        };
        this.state.sendInternalOneWay = (method, params, sessionId) => {
            const id = this.ids.allocate().id;
            this.ids.settle(id, { result: {} });
            const msg = sessionId ? { id, method, params, sessionId } : { id, method, params };
            this.counters.injectedCount++;
            try {
                this.upstream.send(JSON.stringify(msg));
            }
            catch {
                /* ignore — fire-and-forget */
            }
        };
        this.state.close = (reason) => this.finalize(reason);
    }
    /** Phase 1. Attaches upstream listeners and runs plugin `onSessionStart`
     *  in order. On any plugin throw, closes the upstream and returns
     *  `{ok:false, plugin}`. `onSessionEnd` does NOT run on start failure. */
    async start() {
        if (this.started)
            throw new Error("Pipeline.start() called twice");
        this.started = true;
        this.attachUpstreamListeners();
        for (const p of this.plugins) {
            if (!p.onSessionStart)
                continue;
            try {
                await withTimeout(p.onSessionStart(this.state), this.onSessionStartTimeoutMs, `onSessionStart/${p.name}`);
            }
            catch (err) {
                this.logger({ kind: "plugin-error", data: { plugin: p.name, hook: "onSessionStart", err: errToString(err) } });
                this.closed = true;
                try {
                    this.upstream.close(1000);
                }
                catch { /* already closed */ }
                this.ids.rejectAll("plugin-start-failed");
                return { ok: false, plugin: p.name, error: err };
            }
            // Upstream may have closed during onSessionStart (provider dropped or
            // rejected the setup CDP calls). Treat as start failure so the caller
            // can retry with the next provider.
            if (this.closed) {
                return { ok: false, plugin: p.name, error: new Error("upstream closed during onSessionStart") };
            }
        }
        this.logger({ kind: "connect", data: { plugins: this.plugins.map((p) => p.name) } });
        return { ok: true };
    }
    /** Phase 2. Attaches the client (or null for solo mode), starts timers,
     *  awaits close, runs `onSessionEnd` for every plugin, resolves. Must
     *  be called after a successful {@link Pipeline.start}. */
    async run(client) {
        if (!this.started)
            throw new Error("Pipeline.run() called before start()");
        if (this.closed) {
            return { reason: "pipeline-not-started", counters: this.counters };
        }
        this.client = client;
        if (client)
            this.attachClientListeners(client);
        this.startTimers();
        return new Promise((resolve) => {
            this.resolveResult = resolve;
        });
    }
    attachUpstreamListeners() {
        listen(this.upstream, "message", (evt) => this.onUpstreamMessage(evt));
        listen(this.upstream, "close", () => this.finalize("upstream-closed"));
        listen(this.upstream, "error", () => this.finalize("upstream-error"));
    }
    attachClientListeners(client) {
        listen(client, "message", (evt) => this.onClientMessage(evt));
        listen(client, "close", () => this.finalize("client-closed"));
        listen(client, "error", () => this.finalize("client-error"));
    }
    startTimers() {
        if (this.maxSessionMs && this.maxSessionMs > 0) {
            this.maxTimer = setTimeout(() => this.finalize("max-session-exceeded"), this.maxSessionMs);
        }
        if (this.idleTimeoutMs && this.idleTimeoutMs > 0) {
            const check = Math.max(1000, Math.floor(this.idleTimeoutMs / 4));
            this.idleTimer = setInterval(() => {
                if (Date.now() - this.lastClientActivityAt >= this.idleTimeoutMs) {
                    this.finalize("idle-timeout");
                }
            }, check);
        }
    }
    reportActivity(nowMs) {
        if (!this.onActivity)
            return;
        if (nowMs - this.lastReportedActivityAt < this.activityThrottleMs)
            return;
        this.lastReportedActivityAt = nowMs;
        try {
            this.onActivity(nowMs);
        }
        catch {
            /* onActivity failures NEVER kill the session */
        }
    }
    onClientMessage(evt) {
        const data = extractData(evt);
        if (data === undefined)
            return;
        const now = Date.now();
        this.lastClientActivityAt = now;
        this.reportActivity(now);
        this.counters.bytesOut += byteLengthOf(data);
        this.counters.messageCount++;
        if (typeof data !== "string") {
            // Binary WS frames are never CDP; short-circuit forward.
            trySend(this.upstream, data);
            return;
        }
        const msg = tryParse(data);
        if (!msg) {
            trySend(this.upstream, data);
            return;
        }
        this.counters.parsedCount++;
        this.state.applyClientCommand(msg);
        let modified = undefined;
        for (const p of this.plugins) {
            if (!p.onCommand)
                continue;
            let result;
            try {
                result = p.onCommand(modified ?? msg, this.state);
            }
            catch (err) {
                this.logger({ kind: "plugin-error", data: { plugin: p.name, hook: "onCommand", err: errToString(err) } });
                continue;
            }
            if (result === null) {
                this.counters.droppedByPlugin++;
                return;
            }
            if (result && typeof result === "object")
                modified = result;
        }
        trySend(this.upstream, modified ? JSON.stringify(modified) : data);
    }
    onUpstreamMessage(evt) {
        const data = extractData(evt);
        if (data === undefined)
            return;
        this.counters.bytesIn += byteLengthOf(data);
        this.counters.messageCount++;
        if (typeof data !== "string") {
            if (this.client)
                trySend(this.client, data);
            return;
        }
        // Backpressure: drop upstream frames when the client can't keep up.
        // Solo mode (no client) skips this — plugins pace themselves.
        if (this.client) {
            const buffered = this.client.bufferedAmount ?? 0;
            if (buffered > this.dropThresholdBytes) {
                return;
            }
        }
        const msg = tryParse(data);
        if (!msg) {
            if (this.client)
                trySend(this.client, data);
            return;
        }
        this.counters.parsedCount++;
        // Response path: filter internal responses out of the client stream.
        if (typeof msg.id === "number") {
            if (this.ids.owns(msg.id)) {
                this.ids.settle(msg.id, msg);
                return;
            }
            for (const p of this.plugins) {
                if (!p.onResponse)
                    continue;
                try {
                    p.onResponse(msg, this.state);
                }
                catch (err) {
                    this.logger({ kind: "plugin-error", data: { plugin: p.name, hook: "onResponse", err: errToString(err) } });
                }
            }
            if (this.client)
                trySend(this.client, data);
            return;
        }
        // Event path.
        this.state.applyUpstreamEvent(msg);
        for (const p of this.plugins) {
            if (!p.onEvent)
                continue;
            let result;
            try {
                result = p.onEvent(msg, this.state);
            }
            catch (err) {
                this.logger({ kind: "plugin-error", data: { plugin: p.name, hook: "onEvent", err: errToString(err) } });
                continue;
            }
            if (result === null) {
                this.counters.droppedByPlugin++;
                return;
            }
        }
        if (this.client)
            trySend(this.client, data);
    }
    finalize(reason) {
        if (this.closed)
            return;
        this.closed = true;
        if (this.maxTimer)
            clearTimeout(this.maxTimer);
        if (this.idleTimer)
            clearInterval(this.idleTimer);
        void this.runOnSessionEnd(reason).finally(() => {
            this.ids.rejectAll(reason);
            if (this.client) {
                try {
                    this.client.close(1000);
                }
                catch { /* already closed */ }
            }
            try {
                this.upstream.close(1000);
            }
            catch { /* already closed */ }
            this.logger({ kind: "close", data: { reason, counters: this.counters } });
            this.resolveResult?.({ reason, counters: this.counters });
        });
    }
    async runOnSessionEnd(reason) {
        for (const p of this.plugins) {
            if (!p.onSessionEnd)
                continue;
            try {
                await withTimeout(p.onSessionEnd(this.state, reason), this.onSessionEndTimeoutMs, `onSessionEnd/${p.name}`);
            }
            catch (err) {
                this.logger({ kind: "plugin-error", data: { plugin: p.name, hook: "onSessionEnd", err: errToString(err) } });
            }
        }
    }
}
function extractData(evt) {
    if (evt === null || evt === undefined)
        return undefined;
    if (typeof evt === "string")
        return evt;
    if (evt instanceof ArrayBuffer)
        return evt;
    if (ArrayBuffer.isView(evt))
        return evt;
    const asEvent = evt;
    if (asEvent && "data" in asEvent) {
        const d = asEvent.data;
        if (typeof d === "string" || d instanceof ArrayBuffer || ArrayBuffer.isView(d))
            return d;
        if (d && typeof d === "object" && "buffer" in d && d.buffer instanceof ArrayBuffer) {
            return d;
        }
        if (typeof d?.toString === "function") {
            return String(d);
        }
    }
    return undefined;
}
function tryParse(text) {
    if (text.length === 0 || text.charCodeAt(0) !== 123)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        return null;
    }
}
function trySend(sock, data) {
    try {
        sock.send(data);
    }
    catch { /* peer probably closed; finalize will fire from the close event */ }
}
function byteLengthOf(data) {
    if (typeof data === "string")
        return data.length;
    if (data instanceof ArrayBuffer)
        return data.byteLength;
    return data.byteLength;
}
function errToString(err) {
    if (err instanceof Error)
        return err.message.slice(0, 200);
    return String(err).slice(0, 200);
}
//# sourceMappingURL=pipeline.js.map