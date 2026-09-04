/**
 * Page-level setup + action runner shared by the two REST executors
 * (`withBrowserPage` for pooled requests, `withProfilePage` for profile-pinned
 * one-shots).
 *
 * Centralizes the per-request work that's identical between the two:
 *   - setViewportSize / setExtraHTTPHeaders
 *   - goto with waitUntil + timeout
 *   - optional waitForSelector / waitForTimeout
 *   - invoking the user's action
 *
 * Returns the action result plus enough timing data for the caller to assemble
 * the final PageResult (the caller adds startTime + attempt count).
 */
import type { Page } from "playwright-core";
import type { PageOptions } from "./executor.js";
export interface PageRunResult<T> {
    data: T;
    statusCode: number | null;
    resolvedUrl: string;
    /** Wall-clock ms for `page.goto`. */
    navigationMs: number;
    /** Wall-clock ms for the user's action callback. */
    actionMs: number;
}
export declare function runPageAction<T>(page: Page, options: PageOptions, action: (page: Page) => Promise<T>, runOpts?: {
    tolerateGotoTimeout?: boolean;
}): Promise<PageRunResult<T>>;
//# sourceMappingURL=page-runner.d.ts.map