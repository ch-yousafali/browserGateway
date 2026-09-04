import { EventEmitter } from "node:events";
/**
 * Assert that a WebSocket is open. Used by every CDP send() implementation —
 * extracted so the "CDP not connected" guard message stays consistent.
 */
export function assertCdpConnected(ws) {
    // We intentionally use the numeric OPEN constant value (1) here so this
    // helper can be a `function` type without binding to a specific ws module
    // instance — both `import WebSocket from "ws"` clients agree on `1 = OPEN`.
    if (!ws || ws.readyState !== 1) {
        throw new Error("CDP not connected");
    }
}
/**
 * Common base class that implements the typed `on(event, listener)` and
 * `off(event, listener)` overloads required by the `CDPClient` interface.
 *
 * Node's `EventEmitter` is too loosely typed for the CDPClient contract — every
 * concrete CDP client (the production WS one, the in-memory mock, the MCP
 * variant) needs the same two-line override. Extracting it here keeps the
 * contract in one place and stops three different copies of the same
 * boilerplate from drifting.
 */
export class TypedCdpEventEmitter extends EventEmitter {
    on(event, listener) {
        return super.on(event, listener);
    }
    off(event, listener) {
        return super.off(event, listener);
    }
}
//# sourceMappingURL=cdp-event-base.js.map