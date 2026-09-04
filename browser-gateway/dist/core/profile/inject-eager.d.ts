import type { HelperPoolCdpClient } from "./helper-pool-client.js";
import type { CapturedProfile, OriginStorage, SkippedOrigin } from "./types.js";
export interface EagerInjectOptions {
    /** Number of helper pages used for parallel inject. Default 4. */
    helperPages?: number;
    /** Eagerly inject the top-K origins; defer the rest. Default 20. */
    eagerOriginLimit?: number;
    /** Per-origin navigate + evaluate timeout (ms). Default 5_000. */
    perOriginTimeoutMs?: number;
    /** Total wall-clock budget (ms). Default 10_000. */
    totalTimeoutMs?: number;
    /** AbortSignal for cancellation. */
    signal?: AbortSignal;
}
export interface EagerInjectResult {
    cookiesSet: number;
    originsInjected: string[];
    /** Origins not attempted because they were below the K cutoff. */
    originsDeferred: string[];
    /** Origins attempted but failed; reason captured per origin. */
    skippedOrigins: SkippedOrigin[];
    durationMs: number;
}
/** Eagerly injects cookies and the top-K origins' localStorage on an already-connected client. */
export declare function injectStateEager(client: HelperPoolCdpClient, profile: CapturedProfile, opts?: Omit<EagerInjectOptions, "totalTimeoutMs">): Promise<EagerInjectResult>;
/** Opens a fresh WS to the provider, runs the eager inject, then closes the WS. */
export declare function injectStateEagerViaTransient(providerWsUrl: string, profile: CapturedProfile, opts?: EagerInjectOptions): Promise<EagerInjectResult>;
/** Returns a JS expression that writes the origin's localStorage entries. */
export declare function buildLocalStorageWriteExpression(data: OriginStorage): string;
/** Returns origins sorted by lastVisitedAt descending. */
export declare function rankOrigins(storage: Record<string, OriginStorage>): string[];
//# sourceMappingURL=inject-eager.d.ts.map