import type { CDPClient } from "./cdp.js";
import type { CapturedProfile, SkippedOrigin } from "./types.js";
export interface InjectOptions {
    /** Page.navigate timeout (ms). Default 10_000. */
    navigationTimeoutMs?: number;
    /** Runtime.evaluate timeout (ms). Default 5_000. */
    evaluateTimeoutMs?: number;
    /** AbortSignal for cancellation. */
    signal?: AbortSignal;
}
export interface InjectResult {
    cookiesSet: number;
    originsInjected: string[];
    skippedOrigins: SkippedOrigin[];
    durationMs: number;
}
/**
 * Inject captured state into a fresh browser via CDP.
 *
 * Cookies are set first via Network.setCookies (no navigation required).
 * For each origin with localStorage/sessionStorage, the page is navigated to
 * the origin and the state is written via Runtime.evaluate.
 *
 * Skipped origins (navigation error, evaluate error) are reported in the
 * result but do not fail the whole inject — best-effort per origin.
 */
export declare function injectState(cdp: CDPClient, profile: CapturedProfile, opts?: InjectOptions): Promise<InjectResult>;
//# sourceMappingURL=inject.d.ts.map