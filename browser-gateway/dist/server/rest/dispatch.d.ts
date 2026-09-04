/**
 * Single dispatcher for the three REST action handlers (screenshot, content,
 * scrape). When the request body has `profile: "..."`, we run the action via
 * `withProfilePage` (one-shot, no retries, lifecycle.acquire/inject/commit
 * around it). Otherwise we use the default pooled `withBrowserPage` which
 * reuses sessions for throughput.
 *
 * Centralizing this prevents the three handlers from diverging on profile
 * handling (e.g. one forgetting to disable retries, another forgetting the
 * disabled-feature 400).
 */
import type { Page } from "playwright-core";
import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { SessionPool } from "../../core/pool/index.js";
import type { ProfileLifecycle } from "../profile/lifecycle.js";
import type { PageOptions, PageResult } from "./executor.js";
export interface DispatchDeps {
    pool: SessionPool;
    gateway: Gateway;
    logger: Logger;
    profileLifecycle?: ProfileLifecycle;
}
/**
 * If `profileId` is set, route through the profile-pinned executor; otherwise
 * use the pooled executor. `options.provider`, when set, pins the request to
 * one specific backend (no failover) — validated here so the failure modes
 * map to clean HTTP errors instead of leaking out of the pool.
 */
export declare function dispatchPageAction<T>(deps: DispatchDeps, profileId: string | undefined, options: PageOptions, action: (page: Page) => Promise<T>, runOpts?: {
    tolerateGotoTimeout?: boolean;
}): Promise<PageResult<T>>;
//# sourceMappingURL=dispatch.d.ts.map