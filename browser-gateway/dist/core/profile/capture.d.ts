import type { CDPClient } from "./cdp.js";
import { type CapturedProfile } from "./types.js";
export interface CaptureOptions {
    /** Origins to capture localStorage + sessionStorage for. Cookies are always captured. */
    origins?: string[];
    /** Page.navigate timeout (ms). Default 10_000. */
    navigationTimeoutMs?: number;
    /** Runtime.evaluate timeout (ms). Default 5_000. */
    evaluateTimeoutMs?: number;
    /** AbortSignal for cancellation. */
    signal?: AbortSignal;
}
/**
 * Capture browser state from a CDP session for cross-session replay.
 *
 * Captures: cookies (all), localStorage (per-origin), sessionStorage (per-origin), userAgent.
 * Skips: HTTP cache, code cache, service workers, IndexedDB (v2), in-memory state.
 *
 * Per-origin storage capture is best-effort. If one origin fails (network error,
 * runtime exception, navigation timeout) it's added to `meta.skippedOrigins`
 * and the rest of the capture proceeds.
 */
export declare function captureState(cdp: CDPClient, opts?: CaptureOptions): Promise<CapturedProfile>;
//# sourceMappingURL=capture.d.ts.map