import { PROFILE_VERSION, enforceProfileLimits, } from "./index.js";
/** Runs the empty-capture guard, merges captured storage over loaded, applies
 *  size limits, and returns the encoded profile ready for {@link ProfileStorage.save}.
 *  Shared between {@link ProfilePlugin} and {@link ProfileLifecycle}. */
export function mergeAndPrepareProfile(inputs) {
    if (inputs.capturedCookies.length === 0 && inputs.loadedCookies.length > 0) {
        return { action: "preserved-empty-capture" };
    }
    const mergedStorage = { ...inputs.loadedStorage };
    for (const [origin, data] of Object.entries(inputs.capturedStorage)) {
        mergedStorage[origin] = data;
    }
    const profile = {
        version: PROFILE_VERSION,
        capturedAt: new Date().toISOString(),
        cookies: inputs.capturedCookies,
        storage: mergedStorage,
        indexeddb: inputs.loadedIndexeddb,
        meta: {
            capturedOrigins: Object.keys(inputs.capturedStorage),
            skippedOrigins: inputs.capturedSkippedOrigins,
            durationMs: inputs.capturedDurationMs,
        },
    };
    const enforced = enforceProfileLimits(profile, inputs.limits);
    if (enforced.refused) {
        return {
            action: "preserved-refused",
            refusedReason: enforced.refusedReason,
            bytes: enforced.bytes,
        };
    }
    return {
        action: "save",
        profile: { ...enforced.profile, indexeddb: profile.indexeddb },
        evictedOrigins: enforced.evictedOrigins,
        softWarn: enforced.softWarn,
        bytes: enforced.bytes,
    };
}
//# sourceMappingURL=save.js.map