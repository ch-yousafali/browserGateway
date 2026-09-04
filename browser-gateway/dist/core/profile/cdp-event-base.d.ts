import { EventEmitter } from "node:events";
import type WebSocket from "ws";
import type { CDPClient } from "./cdp.js";
/**
 * Assert that a WebSocket is open. Used by every CDP send() implementation —
 * extracted so the "CDP not connected" guard message stays consistent.
 */
export declare function assertCdpConnected(ws: WebSocket | null): asserts ws is WebSocket;
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
export declare abstract class TypedCdpEventEmitter extends EventEmitter implements Pick<CDPClient, "on" | "off"> {
    on(event: string, listener: (params: unknown) => void): this;
    off(event: string, listener: (params: unknown) => void): this;
}
//# sourceMappingURL=cdp-event-base.d.ts.map