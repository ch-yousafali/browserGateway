/** Pure CDP protocol layer — request/response matching + event emission over a pluggable transport. Isomorphic. */
import { dispatchCdpResponse } from "./dispatch.js";
/** Serialize a command envelope for the wire. */
export function encodeCommand(env) {
    const out = {
        id: env.id,
        method: env.method,
        params: env.params ?? {},
    };
    if (env.sessionId)
        out.sessionId = env.sessionId;
    return JSON.stringify(out);
}
/** Parse an incoming CDP frame. Returns null when the payload isn't valid JSON. */
export function decodeIncoming(data) {
    let parsed;
    try {
        parsed = JSON.parse(data);
    }
    catch {
        return null;
    }
    if (typeof parsed !== "object" || parsed === null)
        return null;
    const obj = parsed;
    if (typeof obj.id === "number")
        return obj;
    if (typeof obj.method === "string")
        return obj;
    return null;
}
/** CDP protocol client. Composes a transport with call/response matching + event dispatch.
 *  Same behavioural contract as the OSS `WsCDPClient` but transport-agnostic. */
export class CdpProtocolClient {
    transport;
    nextId = 1;
    pending = new Map();
    eventHandlers = new Map();
    closed = false;
    constructor(transport) {
        this.transport = transport;
        transport.onMessage((data) => this.handleMessage(data));
        transport.onClose((reason) => this.handleClose(reason));
    }
    /** Send a CDP command. Pass a `sessionId` to route to a specific attached target
     *  (flat-mode CDP); pass undefined for the browser-level session. Cloud consumers
     *  typically define their own `send()` sugar as `sendOn(m, p, undefined)`. */
    async sendOn(method, params = {}, sessionId) {
        if (this.closed)
            throw new Error("CDP transport is closed");
        const id = this.nextId++;
        const frame = encodeCommand({ id, method, params, sessionId });
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            try {
                this.transport.send(frame);
            }
            catch (err) {
                this.pending.delete(id);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    }
    on(event, handler) {
        let set = this.eventHandlers.get(event);
        if (!set) {
            set = new Set();
            this.eventHandlers.set(event, set);
        }
        set.add(handler);
    }
    off(event, handler) {
        const set = this.eventHandlers.get(event);
        if (set)
            set.delete(handler);
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await this.transport.close();
        this.rejectAllPending(new Error("CDP transport closed by caller"));
    }
    handleMessage(data) {
        const msg = decodeIncoming(data);
        if (!msg)
            return;
        if (dispatchCdpResponse(msg, this.pending))
            return;
        if (!("method" in msg))
            return;
        const handlers = this.eventHandlers.get(msg.method);
        if (!handlers || handlers.size === 0)
            return;
        const params = { ...(msg.params ?? {}) };
        if (msg.sessionId)
            params.__sessionId = msg.sessionId;
        for (const h of handlers)
            h(params);
    }
    handleClose(reason) {
        this.closed = true;
        this.rejectAllPending(new Error(reason ?? "CDP transport closed by peer"));
    }
    rejectAllPending(err) {
        for (const call of this.pending.values())
            call.reject(err);
        this.pending.clear();
    }
}
//# sourceMappingURL=protocol.js.map