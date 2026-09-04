/** Client-side provider capability probe. Pure TS, no React. Consumed by the
 *  React form components in OSS and SaaS via a thin useProviderProbe hook they
 *  each define locally. */
/** Stable cache key for `${url}|${sortedHeadersJson}`. URL or header changes
 *  produce a different key, forcing a fresh probe. */
export function providerProbeCacheKey(url, headers) {
    const normalized = url.trim();
    if (!headers || Object.keys(headers).length === 0)
        return `${normalized}|`;
    const sorted = Object.keys(headers).sort();
    const pairs = sorted.map((k) => [k, headers[k] ?? ""]);
    return `${normalized}|${JSON.stringify(pairs)}`;
}
/** True when the string looks like a URL we can probe. Cheap prefilter so the
 *  form does not fire probes against half-typed input. */
export function isProbeableUrl(url) {
    const t = url.trim();
    return /^(wss?:\/\/|https?:\/\/)/.test(t);
}
/** Which profile-hint copy to render given (selected profile value, probe state).
 *  Kept pure so the same rules drive OSS and SaaS forms and can be unit-tested
 *  without a DOM. */
export function selectProfileHint(profile, probe, copy) {
    if (profile === "*") {
        if (probe.status === "done") {
            return probe.result.detectedKind === "browserserve" ? copy.hintAny : copy.hintAnyExternal;
        }
        if (probe.status === "probing")
            return copy.hintAnyDetecting;
        // idle or unknown — treat as "we cannot confirm write-back safety yet"
        return copy.hintAnyExternal;
    }
    if (profile)
        return copy.hintPinned(profile);
    return copy.hintNone;
}
//# sourceMappingURL=probe.js.map