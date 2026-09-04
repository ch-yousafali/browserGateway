import type { HelperPoolCdpClient } from "./helper-pool-client.js";
export interface OriginSnapshot {
    origin: string;
    localStorage: Record<string, string>;
}
/** Snapshots the live top-frame origin + full localStorage via `Runtime.evaluate`
 *  on `sessionId`. If `contextId` is provided, the eval is pinned to that
 *  specific execution context — critical for capturing the OLD document
 *  during a top-frame navigation, before the new document takes over.
 *  Returns null on eval failure, race (context destroyed before eval ran),
 *  or non-http(s) origin. Never throws. */
export declare function captureCurrentOriginSnapshot(client: HelperPoolCdpClient, sessionId: string | undefined, timeoutMs?: number, contextId?: number): Promise<OriginSnapshot | null>;
//# sourceMappingURL=capture-current-origin.d.ts.map