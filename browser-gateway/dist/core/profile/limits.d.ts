import type { CapturedProfile } from "./types.js";
export interface ProfileLimits {
    /** Log WARN if serialized profile exceeds this. Default 5 MB. */
    softWarnBytes?: number;
    /** Hard cap — evict origins to fit. Default 50 MB. */
    hardCapBytes?: number;
    /** Maximum origins allowed. Default 1000. Oldest-by-visit are evicted first. */
    maxOrigins?: number;
}
export interface EnforceResult {
    /** Final profile to persist. Same identity as input if no changes. */
    profile: CapturedProfile;
    /** Serialized byte length of the FINAL profile. */
    bytes: number;
    /** Origins removed during enforcement (LRU eviction). */
    evictedOrigins: string[];
    /** True if the FINAL serialized size exceeds `softWarnBytes`. */
    softWarn: boolean;
    /** True if the profile could not be fit under `hardCapBytes`. */
    refused: boolean;
    /** Reason set when `refused` is true. */
    refusedReason?: string;
}
export declare const DEFAULT_PROFILE_LIMITS: {
    readonly softWarnBytes: number;
    readonly hardCapBytes: number;
    readonly maxOrigins: 1000;
};
/** Enforces size and origin-count caps on a profile. Returns a new profile; input untouched. */
export declare function enforceProfileLimits(profile: CapturedProfile, limits?: ProfileLimits): EnforceResult;
//# sourceMappingURL=limits.d.ts.map