import { type CapturedProfile, type ProfileLimits } from "../../core/profile/index.js";
import type { CdpMessage, CdpPlugin, SessionState } from "../types.js";
import type { ProfileStorage } from "./profile-storage.js";
/** Caller-owned lifecycle. When set, the plugin skips its own load/lock
 *  and uses the provided decrypted profile. `onSave` is called with the
 *  captured profile on session end (unless the empty-capture / limits
 *  guards fire); the caller is responsible for release. */
export interface ProfilePluginPreloaded {
    profile: CapturedProfile;
    onSave?: (captured: CapturedProfile) => Promise<void>;
    onEmptyCapture?: () => Promise<void>;
}
export interface ProfilePluginOpts {
    /** Profile identifier. Validated against {@link PROFILE_ID_REGEX}. */
    profileId: string;
    /** Storage adapter. Required unless {@link preloaded} is set. */
    storage?: ProfileStorage;
    /** Caller-owned lifecycle. Skips the plugin's own acquire/load. */
    preloaded?: ProfilePluginPreloaded;
    /** If true, no lock is taken and no state is written back on session end. */
    readOnly?: boolean;
    /** Top-K origins to inject eagerly. Default 20. */
    eagerOriginLimit?: number;
    /** Number of helper pages the inject pool opens. Default 4. */
    helperPages?: number;
    /** Size limits enforced on commit. See `enforceProfileLimits`. */
    limits?: ProfileLimits;
    /** Lock TTL (ms). Default 5 min. */
    lockTtlMs?: number;
    /** Per-CDP-command budget for inject (ms). Default 10_000. */
    cdpTimeoutMs?: number;
    /** Per-origin snapshot timeout (ms). Default 5_000. */
    snapshotTimeoutMs?: number;
    /** "on-navigate" (default) snapshots each origin as the user leaves it and
     *  flushes at close. "on-close" runs the legacy walk-every-origin capture
     *  via helper pages. Use "on-close" as an emergency rollback only. */
    captureMode?: "on-navigate" | "on-close";
    /** Skip residue detection (probe + plant marker). Set for browserserve providers
     *  where each session gets a fresh isolated Chrome by construction and no marker
     *  survives between sessions. Default false — residue check runs for every session. */
    skipResidueCheck?: boolean;
    /** Provider slug included in ProfileResidueError for logging. */
    providerId?: string;
    /** Workspace id stamped into the planted marker (SaaS caller only). */
    workspaceId?: string;
    /** Called on non-fatal issues. */
    logger?: (msg: string, data?: Record<string, unknown>) => void;
}
export type ProfilePluginFailureReason = "INVALID_ID" | "LOCK_HELD" | "DECRYPT_FAILED" | "INJECT_FAILED" | "UNKNOWN_DEK_VERSION";
export declare class ProfilePluginError extends Error {
    readonly reason: ProfilePluginFailureReason;
    constructor(reason: ProfilePluginFailureReason, message: string);
}
/** Thrown when an external CDP provider currently holds a different profile's
 *  state (detected via residue marker). Router surfaces this as HTTP 409 so
 *  the caller retries with a different provider or waits for the underlying
 *  browser instance to release. */
export declare class ProfileResidueError extends Error {
    readonly providerId: string | undefined;
    readonly currentProfile: string;
    readonly requestedProfile: string;
    constructor(providerId: string | undefined, currentProfile: string, requestedProfile: string);
}
/** Injects a captured profile at session start; captures + persists at
 *  session end. Runs on the same CDP connection the client uses. Snapshots
 *  each visited origin's localStorage on top-frame navigation (via
 *  `Page.frameStartedLoading`) so a browser destroyed at WS close leaves
 *  nothing to reconstruct — works uniformly across cloud providers where
 *  the old post-close bookend model failed silently. */
export declare class ProfilePlugin implements CdpPlugin {
    private readonly opts;
    readonly name = "profile";
    private client;
    private state;
    private lockToken;
    private loadedProfile;
    private isExisting;
    private started;
    private readonly captureMode;
    private readonly captureEnabled;
    private readonly snapshotTimeoutMs;
    private readonly pages;
    private readonly originsSnapshot;
    constructor(opts: ProfilePluginOpts);
    onSessionStart(state: SessionState): Promise<void>;
    /** Probes BOTH marker surfaces. Cookie catches "same browser context reused";
     *  localStorage catches "new context per session on same Chromium process"
     *  (Chromium 754576 / puppeteer#11627 / devtools-protocol#43 — localStorage
     *  survives disposeBrowserContext). Returns the first mismatch found, or
     *  null when both agree the provider is clean or holds our own profile. */
    private probeExistingMarker;
    private probeCookieMarker;
    /** localStorage arm — reads the marker via Runtime.evaluate on a helper
     *  target navigated to MARKER_ORIGIN via Fetch-fulfill trick (same
     *  Playwright-style pattern OSS profile inject uses in helper-pool.ts:openHelperPage
     *  + installFetchFulfill + navigateAndEvaluate). Best-effort — swallows failures.
     *
     *  This works where raw `DOMStorage.setDOMStorageItem` does not, because Chromium
     *  requires a frame to have loaded an origin before storage APIs address it —
     *  the fake HTML shell (via Fetch.fulfillRequest) gives us that frame without
     *  a real network hit. See planning/research/v0.3.0-PROFILE-INJECT-OPTIMIZATION.md
     *  §"Candidate 4" for the pattern's provenance. */
    private probeStorageMarker;
    /** Plants BOTH marker surfaces. Cookie survives when the same context is
     *  reused; localStorage survives across `disposeBrowserContext` boundaries
     *  because of the Chromium leak this whole mechanism exists to catch. */
    private plantResidueMarker;
    /** Opens a scratch helper page with Fetch-fulfill installed, navigates it
     *  to MARKER_ORIGIN (served a fake `<html></html>` — no network hit), runs
     *  `fn` with the helper's sessionId, then tears down. Returns whatever `fn`
     *  returned, or null on any failure. */
    private withMarkerHelper;
    onCommand(msg: CdpMessage): void;
    private snapshotAndStash;
    onEvent(msg: CdpMessage): void;
    onSessionEnd(_state: SessionState, _reason: string): Promise<void>;
    private buildCapturedOnNavigate;
    private buildCapturedOnClose;
    private snapshotActivePages;
    private releaseLockSilent;
    /** Test/introspection hook. */
    wasExisting(): boolean;
}
//# sourceMappingURL=profile.d.ts.map