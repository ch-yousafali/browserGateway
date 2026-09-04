/**
 * `withProfilePage` — REST executor variant that pins a request to a profile id.
 *
 * The default `withBrowserPage` reuses pooled browser sessions. That's fine when
 * requests are stateless, but for profile-pinned requests we MUST start from a
 * fresh browser state so the previous request's cookies don't leak in, and we
 * MUST capture the state back to disk on success. Reusing the pool would do
 * neither cleanly.
 *
 * Flow:
 *   1. ProfileLifecycle.acquire(profileId)               — lock + read cookies
 *   2. For each candidate provider:
 *        a. acquireSlot
 *        b. resolve provider WS URL
 *        c. lifecycle.inject(acquired, wsUrl)            — push cookies in via transient CDP
 *        d. chromium.connectOverCDP(wsUrl)               — playwright session
 *        e. open page, run user's action
 *        f. lifecycle.commit(acquired, wsUrl)            — capture latest, save, release lock
 *        g. releaseSlot, disconnect playwright, return result
 *   3. If all providers fail: lifecycle.release (no save), throw 503.
 *
 * Retries: ONE attempt only when a profile is set. Retrying could double-commit
 * state across providers and corrupt the blob — explicit ?profile= disables the
 * automatic retry loop.
 */
import type { Page } from "playwright-core";
import type { Logger } from "pino";
import type { Gateway } from "../../core/gateway.js";
import { ProfileLifecycle } from "../profile/lifecycle.js";
import type { PageOptions, PageResult } from "./executor.js";
export interface WithProfilePageDeps {
    gateway: Gateway;
    lifecycle: ProfileLifecycle;
    logger: Logger;
}
export declare function withProfilePage<T>(deps: WithProfilePageDeps, profileId: string, options: PageOptions, action: (page: Page) => Promise<T>, runOpts?: {
    tolerateGotoTimeout?: boolean;
}): Promise<PageResult<T>>;
//# sourceMappingURL=profile-executor.d.ts.map