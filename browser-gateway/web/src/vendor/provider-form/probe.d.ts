/** Client-side provider capability probe. Pure TS, no React. Consumed by the
 *  React form components in OSS and SaaS via a thin useProviderProbe hook they
 *  each define locally. */
export type ProviderProbeKind = "browserserve" | "generic";
export interface ProviderProbeResult {
    detectedKind: ProviderProbeKind;
    advertisedMaxConcurrent: number | null;
}
export type ProviderProbeState = {
    status: "idle";
} | {
    status: "probing";
} | {
    status: "done";
    result: ProviderProbeResult;
} | {
    status: "unknown";
};
export type ProviderProbeFn = (url: string, headers: Record<string, string> | undefined, signal: AbortSignal) => Promise<ProviderProbeResult>;
/** Stable cache key for `${url}|${sortedHeadersJson}`. URL or header changes
 *  produce a different key, forcing a fresh probe. */
export declare function providerProbeCacheKey(url: string, headers: Record<string, string> | undefined): string;
/** True when the string looks like a URL we can probe. Cheap prefilter so the
 *  form does not fire probes against half-typed input. */
export declare function isProbeableUrl(url: string): boolean;
/** Which profile-hint copy to render given (selected profile value, probe state).
 *  Kept pure so the same rules drive OSS and SaaS forms and can be unit-tested
 *  without a DOM. */
export declare function selectProfileHint(profile: string, probe: ProviderProbeState, copy: {
    hintAny: string;
    hintAnyDetecting: string;
    hintAnyExternal: string;
    hintPinned: (slug: string) => string;
    hintNone: string;
}): string;
//# sourceMappingURL=probe.d.ts.map