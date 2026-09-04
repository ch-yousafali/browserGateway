import type { RelayOptions, RelayResult, RelayTransport } from "../../core/transport.js";
/**
 * Node-native WebSocket relay: raw TCP/TLS + `Duplex.pipe`.
 *
 * The workhorse transport for the OSS gateway CLI. It owns:
 *   - opening the upstream TCP/TLS connection
 *   - writing the WebSocket upgrade request
 *   - parsing the 101 response
 *   - injecting the `X-Session-Id` response header when a session id is provided
 *   - bidirectional byte piping
 *   - tearing both sockets down on any terminal event
 *
 * It does NOT own session tracking, provider health, reconnect parking,
 * profile handoff, or replay recording — those are caller concerns and
 * are surfaced via the `RelayCallbacks` in `RelayOptions`.
 */
export declare class NodeTcpPipeTransport implements RelayTransport {
    readonly name = "node-tcp-pipe";
    relay(opts: RelayOptions): Promise<RelayResult>;
}
//# sourceMappingURL=node.d.ts.map