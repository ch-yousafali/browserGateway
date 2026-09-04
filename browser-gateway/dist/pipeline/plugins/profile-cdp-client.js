/** Bridges the pipeline's SessionState to the HelperPoolCdpClient interface
 *  that profile inject/capture and helper-pool code expect. Commands go out
 *  via `state.sendInternal` (rides the client's own CDP connection — no
 *  second WS). Events are forwarded from the plugin's `onEvent` hook via
 *  {@link dispatchEvent}. */
export class PluginCdpClient {
    state;
    handlers = new Map();
    constructor(state) {
        this.state = state;
    }
    async send(method, params = {}) {
        return this.state.sendInternal(method, params);
    }
    async sendOn(method, params = {}, sessionId) {
        return this.state.sendInternal(method, params, sessionId);
    }
    on(method, handler) {
        const set = this.handlers.get(method) ?? new Set();
        set.add(handler);
        this.handlers.set(method, set);
    }
    off(method, handler) {
        this.handlers.get(method)?.delete(handler);
    }
    /** Route a CDP event received via the pipeline plugin's `onEvent` hook
     *  to any registered handlers. The `__sessionId` magic key preserved from
     *  `WsCDPClient` behavior lets helper-pool code filter by target. */
    dispatchEvent(msg) {
        if (!msg.method)
            return;
        const handlers = this.handlers.get(msg.method);
        if (!handlers || handlers.size === 0)
            return;
        const params = { ...(msg.params ?? {}) };
        if (msg.sessionId)
            params.__sessionId = msg.sessionId;
        for (const h of handlers) {
            try {
                h(params);
            }
            catch { /* isolate handlers from each other */ }
        }
    }
    /** Registered method names (test hook). */
    registeredMethods() {
        return Array.from(this.handlers.keys());
    }
}
//# sourceMappingURL=profile-cdp-client.js.map