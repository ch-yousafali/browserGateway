import type { HelperPoolCdpClient } from "./helper-pool-client.js";
import type { OriginStorage, SkippedOrigin } from "./types.js";
interface BackgroundCommonOptions {
    /** Origins still to inject (from the eager-phase deferred list). */
    origins: string[];
    /** Origin → localStorage data from the profile. */
    storage: Record<string, OriginStorage>;
    /** Shared with lazy hydration to prevent double-injection. */
    alreadyInjected: Set<string>;
    /** Number of helper pages. Default 2 (lower than eager so it doesn't crowd the user). */
    helperPages?: number;
    /** Per-origin timeout. Default 5_000. */
    perOriginTimeoutMs?: number;
    /**
     * Delay before opening the background WS, in ms. Default 0. Some hosted
     * providers cap concurrent WS connections per session token and reject the
     * second one with a 502 if it opens before the eager-phase WS is fully
     * torn down server-side. A short delay gives that teardown time to complete.
     * Not applied when using `runBackgroundInjectOnClient` (the client is already
     * connected — sharing makes the delay unnecessary).
     */
    startDelayMs?: number;
    /** Optional callback when an origin is injected (useful for telemetry). */
    onInjected?: (origin: string) => void;
    /** Optional callback when an origin fails. */
    onError?: (origin: string, reason: string) => void;
    /** AbortSignal. */
    signal?: AbortSignal;
}
export interface BackgroundInjectOptions extends BackgroundCommonOptions {
    /** Provider WS URL. */
    providerWsUrl: string;
    /** Total budget (ms). Default 60_000. */
    totalTimeoutMs?: number;
}
export interface BackgroundInjectResult {
    injected: string[];
    skipped: SkippedOrigin[];
    durationMs: number;
}
/** Runs the background phase on an already-connected client. Caller owns the WS lifecycle. */
export declare function runBackgroundInjectOnClient(client: HelperPoolCdpClient, opts: BackgroundCommonOptions): Promise<BackgroundInjectResult>;
/** Opens its own WS to the provider, runs the background phase, then closes the WS. */
export declare function runBackgroundInject(opts: BackgroundInjectOptions): Promise<BackgroundInjectResult>;
export {};
//# sourceMappingURL=inject-background.d.ts.map