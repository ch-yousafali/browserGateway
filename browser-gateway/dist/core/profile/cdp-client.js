import WebSocket from "ws";
import { TypedCdpEventEmitter, assertCdpConnected } from "./cdp-event-base.js";
import { dispatchCdpResponse } from "../cdp/dispatch.js";
const DEFAULT_COMMAND_TIMEOUT_MS = 30_000;
/**
 * Minimal raw-CDP client over a single WebSocket.
 *
 * - Browser-level only: no Target.attachToTarget by default.
 * - Suitable for Storage.* commands (browser-wide cookies, etc.) without a target.
 * - Tests use the existing EventEmitter-based MockCDP; production uses this.
 */
export class WsCDPClient extends TypedCdpEventEmitter {
    ws = null;
    nextId = 1;
    pending = new Map();
    closeError = null;
    commandTimeoutMs;
    constructor(opts = {}) {
        super();
        this.commandTimeoutMs = opts.commandTimeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    }
    async connect(wsUrl, timeoutMs = 10_000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const ws = new WebSocket(wsUrl, { perMessageDeflate: false });
            const timer = setTimeout(() => {
                if (resolved)
                    return;
                resolved = true;
                try {
                    ws.close();
                }
                catch { }
                reject(new Error(`CDP connect timeout after ${timeoutMs}ms: ${wsUrl}`));
            }, timeoutMs);
            ws.once("open", () => {
                if (resolved)
                    return;
                resolved = true;
                clearTimeout(timer);
                this.ws = ws;
                ws.on("message", (data) => this.handleMessage(data));
                ws.on("close", (code, reason) => this.handleClose(code, reason.toString("utf8")));
                ws.on("error", (err) => {
                    this.closeError = err;
                });
                resolve();
            });
            ws.once("error", (err) => {
                if (resolved)
                    return;
                resolved = true;
                clearTimeout(timer);
                reject(err);
            });
        });
    }
    async send(method, params = {}) {
        return this.sendOn(method, params, undefined);
    }
    /**
     * Send a CDP command tagged with a flat-mode sessionId. Identical to send()
     * when sessionId is undefined. Used by the eager-inject helper-page pool
     * to route commands to specific attached targets.
     */
    async sendOn(method, params = {}, sessionId) {
        assertCdpConnected(this.ws);
        const id = this.nextId++;
        const envelope = { id, method, params };
        if (sessionId)
            envelope.sessionId = sessionId;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const pending = this.pending.get(id);
                if (!pending)
                    return;
                this.pending.delete(id);
                pending.reject(new Error(`CDP command timeout after ${this.commandTimeoutMs}ms: ${method}`));
            }, this.commandTimeoutMs);
            this.pending.set(id, { resolve: resolve, reject, timer });
            this.ws.send(JSON.stringify(envelope), (err) => {
                if (err) {
                    const pending = this.pending.get(id);
                    if (pending) {
                        clearTimeout(pending.timer);
                        this.pending.delete(id);
                        reject(err);
                    }
                }
            });
        });
    }
    relayMessage = null;
    relayClose = null;
    /**
     * Forwards a raw client CDP message straight to the provider, unparsed. Used
     * by the gateway's single-connection profile relay so the client's session
     * rides the SAME socket that inject/capture use — no second browser.
     */
    rawSend(data) {
        this.ws?.send(data);
    }
    /**
     * Relay mode: forward every provider message to `onMessage` and the socket
     * close to `onClose`, in addition to the normal command/event handling.
     * Provider replies to the client's own command ids have no pending call here,
     * so `handleMessage` ignores them — only the relay forwards them onward.
     */
    startRelay(onMessage, onClose) {
        if (!this.ws)
            return;
        this.relayMessage = (data) => onMessage(data);
        this.relayClose = onClose;
        this.ws.on("message", this.relayMessage);
        this.ws.once("close", this.relayClose);
    }
    stopRelay() {
        if (this.ws && this.relayMessage)
            this.ws.off("message", this.relayMessage);
        if (this.ws && this.relayClose)
            this.ws.off("close", this.relayClose);
        this.relayMessage = null;
        this.relayClose = null;
    }
    async close() {
        if (!this.ws)
            return;
        if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
            await new Promise((resolve) => {
                const t = setTimeout(() => {
                    // H2: if the peer never sends a close frame, the pending sends would
                    // otherwise hang forever after we null this.ws. Force-reject them.
                    this.rejectAllPending(new Error("CDP close timeout — connection did not close cleanly"));
                    try {
                        this.ws.terminate();
                    }
                    catch { }
                    resolve();
                }, 2_000);
                this.ws.once("close", () => {
                    clearTimeout(t);
                    resolve();
                });
                try {
                    this.ws.close();
                }
                catch { }
            });
        }
        this.ws = null;
    }
    rejectAllPending(err) {
        for (const call of this.pending.values()) {
            clearTimeout(call.timer);
            call.reject(err);
        }
        this.pending.clear();
    }
    handleMessage(data) {
        let msg;
        try {
            msg = JSON.parse(data.toString("utf8"));
        }
        catch {
            return;
        }
        if (dispatchCdpResponse(msg, this.pending))
            return;
        if (typeof msg.method === "string") {
            // Listeners can read `__sessionId` off the params object to scope event
            // dispatch to the right helper page. Keeping it as a magic key on params
            // avoids changing the listener signature (the existing TypedCdpEventEmitter
            // pattern in this file passes params straight through).
            const params = { ...(msg.params ?? {}) };
            if (typeof msg.sessionId === "string")
                params.__sessionId = msg.sessionId;
            this.emit(msg.method, params);
        }
    }
    handleClose(code, reason) {
        const err = this.closeError ?? new Error(`CDP connection closed (code=${code}${reason ? `, reason=${reason}` : ""})`);
        this.rejectAllPending(err);
    }
}
//# sourceMappingURL=cdp-client.js.map