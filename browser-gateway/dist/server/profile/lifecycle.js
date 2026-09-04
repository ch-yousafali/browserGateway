import { PROFILE_VERSION, captureFullStateOnClient, captureFullStateViaTransient, decodeBlob, decodeBlobHeader, encodeBlob, enforceProfileLimits, injectStateEager, injectStateEagerViaTransient, PROFILE_ID_REGEX, } from "../../core/profile/index.js";
import { mergeAndPrepareProfile } from "../../core/profile/save.js";
export class LifecycleError extends Error {
    reason;
    constructor(reason, message) {
        super(message);
        this.reason = reason;
        this.name = "LifecycleError";
    }
}
/** Orchestrates acquire/inject/commit/release for a profile around one session. */
export class ProfileLifecycle {
    store;
    dekByVersion;
    currentDekVersion;
    logger;
    opts;
    pendingCommits = new Set();
    draining = false;
    constructor(store, dekByVersion, currentDekVersion, logger, opts = {}) {
        this.store = store;
        this.dekByVersion = dekByVersion;
        this.currentDekVersion = currentDekVersion;
        this.logger = logger;
        this.opts = opts;
    }
    /** Acquires the profile lock and decrypts the stored blob if any. */
    async acquire(profileId) {
        if (!PROFILE_ID_REGEX.test(profileId)) {
            throw new LifecycleError("INVALID_ID", `invalid profile id: "${profileId}"`);
        }
        const lockTtlMs = this.opts.lockTtlMs ?? 5 * 60_000;
        const lockToken = await this.store.lock(profileId, lockTtlMs);
        if (!lockToken) {
            throw new LifecycleError("LOCK_HELD", `profile "${profileId}" is in use by another session`);
        }
        try {
            const data = await this.loadProfileData(profileId);
            return { profileId, lockToken, readOnly: false, ...data };
        }
        catch (err) {
            await this.store.unlock(profileId, lockToken).catch(() => undefined);
            throw err;
        }
    }
    /**
     * Loads a profile WITHOUT taking the lock, for a read-only session: many
     * sessions can share one profile at once (no serialization) and nothing is
     * saved back. `release`/`commit` are no-ops for a read-only acquire.
     */
    async acquireReadOnly(profileId) {
        if (!PROFILE_ID_REGEX.test(profileId)) {
            throw new LifecycleError("INVALID_ID", `invalid profile id: "${profileId}"`);
        }
        const data = await this.loadProfileData(profileId);
        return { profileId, lockToken: null, readOnly: true, ...data };
    }
    async loadProfileData(profileId) {
        const blob = await this.store.getRaw(profileId);
        if (!blob) {
            return { cookies: [], storage: {}, indexeddb: [], isExisting: false };
        }
        const header = decodeBlobHeader(blob);
        const dek = this.dekByVersion.get(header.dekVersion);
        if (!dek) {
            throw new LifecycleError("UNKNOWN_DEK_VERSION", `profile blob references DEK version ${header.dekVersion} not in the key ring`);
        }
        let plaintext;
        try {
            plaintext = decodeBlob(blob, dek, profileId);
        }
        catch (err) {
            throw new LifecycleError("DECRYPT_FAILED", `failed to decrypt profile: ${err instanceof Error ? err.message : String(err)}`);
        }
        let parsed;
        try {
            parsed = JSON.parse(plaintext.toString("utf-8"));
        }
        catch (err) {
            throw new LifecycleError("DECRYPT_FAILED", `profile decoded but JSON malformed: ${err instanceof Error ? err.message : String(err)}`);
        }
        const cookies = Array.isArray(parsed.cookies) ? parsed.cookies : [];
        const storage = (parsed.storage && typeof parsed.storage === "object")
            ? parsed.storage
            : {};
        const indexeddb = Array.isArray(parsed.indexeddb) ? parsed.indexeddb : [];
        return { cookies, storage, indexeddb, isExisting: true };
    }
    /**
     * Injects cookies plus eager top-K localStorage; deferred origins are returned to the caller.
     *
     * If `client` is provided, the inject reuses that already-connected WS so the caller can
     * also pass it to the background phase and to commit() — one WS for the whole session.
     * Without `client`, a transient WS is opened and closed for this call only.
     */
    async inject(acquired, providerWsUrl, client) {
        const cdpTimeoutMs = this.opts.cdpTimeoutMs ?? 10_000;
        const eagerOriginLimit = this.opts.eagerOriginLimit ?? 20;
        const helperPages = this.opts.helperPages ?? 4;
        const profile = {
            version: PROFILE_VERSION,
            capturedAt: new Date().toISOString(),
            cookies: acquired.cookies,
            storage: acquired.storage,
            meta: { capturedOrigins: [], skippedOrigins: [], durationMs: 0 },
        };
        let result;
        try {
            result = client
                ? await injectStateEager(client, profile, { eagerOriginLimit, helperPages })
                : await injectStateEagerViaTransient(providerWsUrl, profile, {
                    eagerOriginLimit,
                    helperPages,
                    totalTimeoutMs: cdpTimeoutMs,
                });
        }
        catch (err) {
            throw new LifecycleError("INJECT_FAILED", `state inject failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        this.logger.info({
            profileId: acquired.profileId,
            cookies: result.cookiesSet,
            originsInjected: result.originsInjected.length,
            originsDeferred: result.originsDeferred.length,
            skippedOrigins: result.skippedOrigins.length,
            durationMs: result.durationMs,
        }, "profile lifecycle: state injected");
        return {
            injected: result.cookiesSet,
            originsInjected: result.originsInjected,
            originsDeferred: result.originsDeferred,
        };
    }
    /**
     * Captures latest state, encrypts, persists, and releases the lock. Errors are swallowed.
     *
     * If `client` is provided, capture reuses that already-connected WS — pair this with
     * inject(acquired, url, client) and the background phase so the entire profile session
     * runs on one WS connection per provider.
     */
    async commit(acquired, providerWsUrl, client) {
        const promise = this.runCommit(acquired, providerWsUrl, client);
        this.pendingCommits.add(promise);
        promise.finally(() => this.pendingCommits.delete(promise));
        return promise;
    }
    /** Encrypts a profile with the current DEK and writes it to the store. No-op if the DEK is missing. */
    async encodeAndStore(profile, profileId, logMessage, extraLogFields) {
        const plaintext = Buffer.from(JSON.stringify(profile), "utf-8");
        const dek = this.dekByVersion.get(this.currentDekVersion);
        if (!dek) {
            this.logger.error({ profileId, dekVersion: this.currentDekVersion }, "profile lifecycle: current DEK missing, skipping save");
            return;
        }
        const { bytes } = encodeBlob(dek, this.currentDekVersion, plaintext, profileId);
        await this.store.putRaw(profileId, bytes);
        this.logger.info({ profileId, bytes: bytes.length, ...extraLogFields }, logMessage);
    }
    async runCommit(acquired, providerWsUrl, client) {
        const commitTimeoutMs = this.opts.commitTimeoutMs ?? this.opts.cdpTimeoutMs ?? 10_000;
        const helperPages = this.opts.helperPages ?? 4;
        try {
            const captureResult = client
                ? await captureFullStateOnClient(client, Object.keys(acquired.storage), { helperPages, includeCookieDerivedOrigins: true })
                : await captureFullStateViaTransient(providerWsUrl, Object.keys(acquired.storage), { helperPages, totalTimeoutMs: commitTimeoutMs, includeCookieDerivedOrigins: true });
            const prepared = mergeAndPrepareProfile({
                loadedStorage: acquired.storage,
                loadedCookies: acquired.cookies,
                loadedIndexeddb: acquired.indexeddb,
                capturedCookies: captureResult.cookies,
                capturedStorage: captureResult.storage,
                capturedSkippedOrigins: captureResult.skippedOrigins,
                capturedDurationMs: captureResult.durationMs,
                limits: this.opts.limits,
            });
            if (prepared.action === "preserved-empty-capture") {
                this.logger.warn({ profileId: acquired.profileId, previousCookies: acquired.cookies.length }, "profile lifecycle: 0 cookies captured but previous had — preserved");
                return;
            }
            if (prepared.action === "preserved-refused") {
                this.logger.warn({ profileId: acquired.profileId, bytes: prepared.bytes, reason: prepared.refusedReason }, "profile lifecycle: refused to save — previous state preserved");
                return;
            }
            if (prepared.evictedOrigins && prepared.evictedOrigins.length > 0) {
                this.logger.info({
                    profileId: acquired.profileId,
                    evicted: prepared.evictedOrigins.length,
                    evictedOrigins: prepared.evictedOrigins.slice(0, 5),
                    bytes: prepared.bytes,
                }, "profile lifecycle: evicted oldest origins to fit budget");
            }
            if (prepared.softWarn) {
                this.logger.warn({ profileId: acquired.profileId, bytes: prepared.bytes }, "profile lifecycle: profile exceeds soft-warn threshold");
            }
            await this.encodeAndStore(prepared.profile, acquired.profileId, "profile lifecycle: state saved", {
                cookies: prepared.profile.cookies.length,
            });
        }
        catch (err) {
            this.logger.warn({
                profileId: acquired.profileId,
                error: err instanceof Error ? err.message : String(err),
            }, "profile lifecycle: capture/save failed, previous state preserved");
        }
        finally {
            await this.release(acquired);
        }
    }
    /** Awaits all in-flight commits, up to `timeoutMs`. Logs WARN on timeout. */
    async drain(timeoutMs) {
        this.draining = true;
        if (this.pendingCommits.size === 0)
            return;
        this.logger.info({ pending: this.pendingCommits.size, timeoutMs }, "profile lifecycle: draining in-flight commits");
        const allDone = Promise.allSettled(Array.from(this.pendingCommits));
        const deadline = new Promise((resolve) => setTimeout(() => resolve("timeout"), timeoutMs));
        const result = await Promise.race([allDone.then(() => "done"), deadline]);
        if (result === "timeout") {
            this.logger.warn({ remaining: this.pendingCommits.size, timeoutMs }, "profile lifecycle: drain timeout — some commits did not finish");
        }
        else {
            this.logger.info("profile lifecycle: drain complete");
        }
    }
    /** Returns the number of in-flight commits. */
    pendingCommitCount() {
        return this.pendingCommits.size;
    }
    /** Returns true once `drain()` has been called. */
    isDraining() {
        return this.draining;
    }
    /** Releases the lock without persisting. */
    /**
     * Stores a profile captured by a browserserve provider (via the channel),
     * then releases the lock. Unlike {@link commit}, capture already happened
     * remotely, so there is no CDP work here. Preserves previous state if the
     * capture came back empty. Always releases the lock.
     */
    async commitCaptured(acquired, captured) {
        try {
            const cookies = captured.cookies;
            if (cookies.length === 0 && acquired.cookies.length > 0) {
                this.logger.warn({ profileId: acquired.profileId, previousCookies: acquired.cookies.length }, "browserserve capture returned 0 cookies — preserving previous state, not overwriting");
                return;
            }
            const mergedStorage = { ...acquired.storage };
            for (const [origin, data] of Object.entries(captured.storage)) {
                mergedStorage[origin] = data;
            }
            const profile = {
                version: PROFILE_VERSION,
                capturedAt: new Date().toISOString(),
                cookies,
                storage: mergedStorage,
                indexeddb: captured.indexeddb.length > 0 ? captured.indexeddb : acquired.indexeddb,
                meta: { capturedOrigins: Object.keys(captured.storage), skippedOrigins: [], durationMs: 0 },
            };
            const enforced = enforceProfileLimits(profile, this.opts.limits);
            if (enforced.refused) {
                this.logger.warn({ profileId: acquired.profileId, bytes: enforced.bytes, reason: enforced.refusedReason }, "browserserve profile refused to save — previous state preserved");
                return;
            }
            const finalProfile = { ...enforced.profile, indexeddb: profile.indexeddb };
            await this.encodeAndStore(finalProfile, acquired.profileId, "browserserve profile state saved", {
                cookies: cookies.length,
                indexeddbFiles: profile.indexeddb?.length ?? 0,
            });
        }
        catch (err) {
            this.logger.warn({ profileId: acquired.profileId, error: err instanceof Error ? err.message : String(err) }, "browserserve commit failed, previous state preserved");
        }
        finally {
            await this.release(acquired);
        }
    }
    async release(acquired) {
        if (acquired.readOnly || !acquired.lockToken) {
            return; // read-only acquire held no lock
        }
        await this.store.unlock(acquired.profileId, acquired.lockToken).catch((err) => {
            this.logger.warn({ profileId: acquired.profileId, error: err instanceof Error ? err.message : String(err) }, "profile lifecycle: unlock failed (will recover via stale TTL)");
        });
    }
}
//# sourceMappingURL=lifecycle.js.map