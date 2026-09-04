import type { ProviderState } from "../types.js";
import type { ProviderStore } from "../providers/registry.js";
import type { CooldownTracker } from "../tracking/cooldown.js";
export { isEligibleForProfile } from "../providers/effective.js";
export type Strategy = "priority-chain" | "round-robin" | "least-connections" | "latency-optimized" | "weighted";
export interface SelectOptions {
    strategy?: Strategy;
    /**
     * When set, restrict the candidate list to exactly this provider id.
     * Returns `[provider]` when the pinned provider is healthy + has a free slot,
     * `[]` when it's missing / in cooldown / saturated. All other selection
     * strategies are bypassed — the caller asked for one specific provider,
     * not a routing decision.
     */
    targetProviderId?: string;
    /**
     * Match against per-provider profile pins. `null`/`undefined` means the
     * caller is not requesting a profile (stateless). A string means the caller
     * is requesting `?profile=<value>`.
     */
    profileId?: string | null;
    /**
     * When true, session is read-only (state injected but never captured back).
     * Bypasses the profile-eligibility rules — since no state is written to the
     * canonical profile, cross-profile leak on a shared upstream is impossible,
     * so any healthy CDP provider is eligible regardless of pinning or
     * `multiProfile` config. Default false (matches historical write-back
     * eligibility semantics).
     */
    readOnly?: boolean;
}
export declare class ProviderSelector {
    private registry;
    private cooldown;
    private defaultStrategy;
    private roundRobinIndex;
    private weightedState;
    constructor(registry: ProviderStore, cooldown: CooldownTracker, defaultStrategy: Strategy);
    /** Changes the active routing strategy for subsequent selections. */
    setStrategy(strategy: Strategy): void;
    getCandidates(opts?: SelectOptions): ProviderState[];
    private applyStrategy;
    private smoothWeightedRoundRobin;
}
//# sourceMappingURL=selector.d.ts.map