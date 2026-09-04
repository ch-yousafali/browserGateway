import type { HelperPoolCdpClient } from "./helper-pool-client.js";
export interface HelperPage {
    targetId: string;
    sessionId: string;
}
/** Opens a helper target with Fetch and Page domains enabled. */
export declare function openHelperPage(client: HelperPoolCdpClient): Promise<HelperPage>;
/** Installs a Fetch.requestPaused fulfiller scoped to the given sessions. Returns an unregister fn. */
export declare function installFetchFulfill(client: HelperPoolCdpClient, helperSessionIds: Set<string>): () => void;
/** Closes helper targets and disables Fetch on each session. */
export declare function closeHelperPages(client: HelperPoolCdpClient, helpers: HelperPage[]): Promise<void>;
/** Opens up to `count` helper pages sequentially. Returns however many succeeded. */
export declare function openHelperPool(client: HelperPoolCdpClient, count: number): Promise<HelperPage[]>;
/**
 * Wraps the helper-pool lifecycle used by profile capture/inject: install
 * Fetch fulfill, open up to `min(helperCount, originCount)` helper pages,
 * hand them to `work`, guarantee teardown in `finally`.
 */
export declare function withHelperPool<T>(client: HelperPoolCdpClient, helperCount: number, originCount: number, work: (helpers: HelperPage[]) => Promise<T>): Promise<T>;
/** Races a Promise against a per-operation timeout. */
export declare function raceTimeout<T>(p: Promise<T>, timeoutMs: number, label: string): Promise<T>;
/** Wall-clock deadline around a whole operation. Rejects on timeout. */
export declare function withDeadline<T>(op: Promise<T>, timeoutMs: number, label: string): Promise<T>;
/** Navigates the helper to an origin and evaluates `expression` in its page context. */
export declare function navigateAndEvaluate(client: HelperPoolCdpClient, helper: HelperPage, origin: string, expression: string, timeoutMs: number): Promise<unknown>;
/** Round-robin work over `origins` across `helpers`. Per-origin errors go to `onError`. */
export declare function runHelperPool<T>(opts: {
    helpers: HelperPage[];
    origins: string[];
    work: (origin: string, helper: HelperPage) => Promise<T>;
    onSuccess: (origin: string, result: T) => void;
    onError: (origin: string, reason: string) => void;
    signal?: AbortSignal;
}): Promise<void>;
//# sourceMappingURL=helper-pool.d.ts.map