import type { SiblingProvider } from "./types.js";
export interface PriorityEffect {
    rank: number;
    label: string;
    tiedCount: number;
}
export interface WeightEffect {
    percent: number;
    label: string;
    isOnlyAtTier: boolean;
}
/**
 * Describes a provider's routing position given its priority and every sibling's
 * priority (including its own). Rank 0 = primary, 1 = first fallback, and so on.
 * Ties at the same priority are grouped and share traffic via the router strategy.
 */
export declare function computePriorityEffect(priority: number, siblingPriorities: number[]): PriorityEffect;
/**
 * Describes a provider's share of traffic among siblings at the same priority.
 * Returns 100% and an "only at this tier" label when nothing else shares the tier.
 */
export declare function computeWeightEffect(priority: number, weight: number, siblings: SiblingProvider[]): WeightEffect;
//# sourceMappingURL=effect.d.ts.map