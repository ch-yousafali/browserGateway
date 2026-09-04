import type { ProviderConfig, ProviderState } from "../types.js";
/**
 * Static config-shape check: does the provider's declared `profile` / `multiProfile`
 * config admit the requested profile? Optimistic — does not know whether the provider
 * can safely serve multi-profile at runtime. Use `isEligibleProviderForProfile`
 * for routing decisions.
 */
export declare function isEligibleForProfile(config: ProviderConfig, requestedProfile: string | null | undefined): boolean;
/**
 * Runtime profile-eligibility. A provider slot is eligible to serve the requested
 * profile when it is a detected browserserve instance (fresh Chrome per session)
 * or carries an explicit `profile: "X"` pin matching the request. `config.multiProfile`
 * is not trusted on non-browserserve providers because shared external browser
 * instances retain profile-A residue (HttpOnly cookies, disk storage, service workers)
 * that leaks into subsequent profile-B sessions.
 */
export declare function isEligibleProviderForProfile(provider: ProviderState, requestedProfile: string | null | undefined): boolean;
/**
 * The concurrency ceiling actually enforced for a provider: explicit
 * `limits.maxConcurrent` config always wins; otherwise the capacity the
 * provider advertised (browserserve auto-capacity); otherwise unlimited.
 */
export declare function effectiveMaxConcurrent(provider: ProviderState): number | undefined;
/** True when the provider has a free slot under its effective ceiling. */
export declare function hasFreeSlot(provider: ProviderState): boolean;
//# sourceMappingURL=effective.d.ts.map