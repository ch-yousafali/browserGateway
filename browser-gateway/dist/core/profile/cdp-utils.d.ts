/**
 * Shared CDP helpers used by both the capture and inject paths.
 *
 * Both flows do "navigate, evaluate JS, return result" per-origin sequences,
 * with the same timeout/wait/exception-handling around them. Extracted here so
 * the navigation contract stays consistent across capture and inject.
 */
import type { CDPClient } from "./cdp.js";
/** Default timeouts for profile capture and inject paths. */
export declare const PROFILE_DEFAULTS: {
    readonly navigationTimeoutMs: 10000;
    readonly evaluateTimeoutMs: 5000;
};
export interface ProfileOpsOptions {
    navigationTimeoutMs?: number;
    evaluateTimeoutMs?: number;
    signal?: AbortSignal;
}
/**
 * Resolve the common shape of options for both `captureState` and `injectState`:
 * stamps `started`, picks up timeouts (falling back to {@link PROFILE_DEFAULTS}),
 * and throws if the signal was already aborted.
 *
 * @param abortLabel  Word used in the abort error message — e.g. "capture" or
 *                    "inject" — so callers see which op was aborted.
 */
export declare function resolveProfileOptions(opts: ProfileOpsOptions, abortLabel: string): {
    started: number;
    navTimeout: number;
    evalTimeout: number;
    signal?: AbortSignal;
};
/** Wrap a Promise with a hard deadline. Rejects with a labelled error on timeout. */
export declare function withTimeout<T>(p: Promise<T>, timeoutMs: number, label: string): Promise<T>;
/** Resolve once `event` fires on the CDP client. Times out after `timeoutMs`. */
export declare function waitForEvent(cdp: CDPClient, event: string, timeoutMs: number): Promise<void>;
/** Navigate the CDP target to the given URL and wait for the page to be evaluable. */
export declare function navigateAndWait(cdp: CDPClient, url: string, timeoutMs: number): Promise<void>;
/** Run Runtime.evaluate with timeout + structured exception handling. */
export declare function evaluateExpression(cdp: CDPClient, expression: string, timeoutMs: number): Promise<unknown>;
//# sourceMappingURL=cdp-utils.d.ts.map