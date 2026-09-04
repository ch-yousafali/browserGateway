import { WebSocket } from "ws";
/** Open a Node `ws` upstream and race it against a timeout. Resolves once
 *  `open` fires; rejects (via `{ok:false, err}`) on `error` or timeout.
 *  `headers` forwards provider-config and/or client-derived headers on the WS
 *  upgrade (Authorization: Bearer, X-API-Key, subprotocol negotiation, etc.). */
export declare function openUpstream(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<{
    ok: true;
    ws: WebSocket;
} | {
    ok: false;
    err: string;
}>;
//# sourceMappingURL=upstream-open.d.ts.map