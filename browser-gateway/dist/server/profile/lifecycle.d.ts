import type { Logger } from "pino";
import { type BrowserserveFile, type CdpCookie, type OriginStorage, type ProfileLimits } from "../../core/profile/index.js";
import type { WsCDPClient } from "../../core/profile/cdp-client.js";
import type { LockToken, ProfileStore } from "../../core/profile/store.js";
export interface LifecycleOptions {
    /** Lock TTL: maximum time we'll hold a profile lock for one session. */
    lockTtlMs?: number;
    /** Timeout for the inject path. */
    cdpTimeoutMs?: number;
    /** Timeout for the commit path. Defaults to `cdpTimeoutMs`. */
    commitTimeoutMs?: number;
    /** Top-K origins to inject eagerly. Default 20. */
    eagerOriginLimit?: number;
    /** Number of helper pages for parallel inject/capture. Default 4. */
    helperPages?: number;
    /** Size limits enforced on commit. See `enforceProfileLimits`. */
    limits?: ProfileLimits;
}
export interface AcquiredProfile {
    profileId: string;
    /** Lock token from `acquire`; `null` for a read-only acquire (no lock taken). */
    lockToken: LockToken | null;
    /** Read-only session: no lock, and the profile is never saved back. */
    readOnly: boolean;
    /** Cookies parsed from the existing encrypted blob (empty if profile is new). */
    cookies: CdpCookie[];
    /** Per-origin localStorage parsed from the existing blob (empty if new). */
    storage: Record<string, OriginStorage>;
    /** browserserve-native layer (IndexedDB/SW files); empty for external-only profiles. */
    indexeddb: BrowserserveFile[];
    /** True if the store had an existing entry for this profile id. */
    isExisting: boolean;
}
export type LifecycleFailureReason = "INVALID_ID" | "LOCK_HELD" | "DECRYPT_FAILED" | "INJECT_FAILED" | "UNKNOWN_DEK_VERSION";
export declare class LifecycleError extends Error {
    readonly reason: LifecycleFailureReason;
    constructor(reason: LifecycleFailureReason, message: string);
}
/** Orchestrates acquire/inject/commit/release for a profile around one session. */
export declare class ProfileLifecycle {
    private readonly store;
    private readonly dekByVersion;
    private readonly currentDekVersion;
    private readonly logger;
    private readonly opts;
    private readonly pendingCommits;
    private draining;
    constructor(store: ProfileStore, dekByVersion: ReadonlyMap<number, Buffer>, currentDekVersion: number, logger: Logger, opts?: LifecycleOptions);
    /** Acquires the profile lock and decrypts the stored blob if any. */
    acquire(profileId: string): Promise<AcquiredProfile>;
    /**
     * Loads a profile WITHOUT taking the lock, for a read-only session: many
     * sessions can share one profile at once (no serialization) and nothing is
     * saved back. `release`/`commit` are no-ops for a read-only acquire.
     */
    acquireReadOnly(profileId: string): Promise<AcquiredProfile>;
    private loadProfileData;
    /**
     * Injects cookies plus eager top-K localStorage; deferred origins are returned to the caller.
     *
     * If `client` is provided, the inject reuses that already-connected WS so the caller can
     * also pass it to the background phase and to commit() — one WS for the whole session.
     * Without `client`, a transient WS is opened and closed for this call only.
     */
    inject(acquired: AcquiredProfile, providerWsUrl: string, client?: WsCDPClient): Promise<{
        injected: number;
        originsInjected: string[];
        originsDeferred: string[];
    }>;
    /**
     * Captures latest state, encrypts, persists, and releases the lock. Errors are swallowed.
     *
     * If `client` is provided, capture reuses that already-connected WS — pair this with
     * inject(acquired, url, client) and the background phase so the entire profile session
     * runs on one WS connection per provider.
     */
    commit(acquired: AcquiredProfile, providerWsUrl: string, client?: WsCDPClient): Promise<void>;
    /** Encrypts a profile with the current DEK and writes it to the store. No-op if the DEK is missing. */
    private encodeAndStore;
    private runCommit;
    /** Awaits all in-flight commits, up to `timeoutMs`. Logs WARN on timeout. */
    drain(timeoutMs: number): Promise<void>;
    /** Returns the number of in-flight commits. */
    pendingCommitCount(): number;
    /** Returns true once `drain()` has been called. */
    isDraining(): boolean;
    /** Releases the lock without persisting. */
    /**
     * Stores a profile captured by a browserserve provider (via the channel),
     * then releases the lock. Unlike {@link commit}, capture already happened
     * remotely, so there is no CDP work here. Preserves previous state if the
     * capture came back empty. Always releases the lock.
     */
    commitCaptured(acquired: AcquiredProfile, captured: {
        cookies: CdpCookie[];
        storage: Record<string, OriginStorage>;
        indexeddb: BrowserserveFile[];
    }): Promise<void>;
    release(acquired: AcquiredProfile): Promise<void>;
}
//# sourceMappingURL=lifecycle.d.ts.map