import { hasFreeSlot, isEligibleProviderForProfile } from "../providers/effective.js";
export { isEligibleForProfile } from "../providers/effective.js";
export class ProviderSelector {
    registry;
    cooldown;
    defaultStrategy;
    roundRobinIndex = 0;
    weightedState = new Map();
    constructor(registry, cooldown, defaultStrategy) {
        this.registry = registry;
        this.cooldown = cooldown;
        this.defaultStrategy = defaultStrategy;
    }
    /** Changes the active routing strategy for subsequent selections. */
    setStrategy(strategy) {
        this.defaultStrategy = strategy;
    }
    getCandidates(opts = {}) {
        const skipProfileCheck = opts.readOnly === true;
        if (opts.targetProviderId !== undefined) {
            const pinned = this.registry.get(opts.targetProviderId);
            if (!pinned)
                return [];
            if (this.cooldown.isInCooldown(pinned))
                return [];
            if (!hasFreeSlot(pinned))
                return [];
            if (!skipProfileCheck && !isEligibleProviderForProfile(pinned, opts.profileId))
                return [];
            return [pinned];
        }
        const all = this.registry.getAllSortedByPriority();
        const available = all.filter((b) => {
            if (this.cooldown.isInCooldown(b))
                return false;
            if (!hasFreeSlot(b))
                return false;
            if (!skipProfileCheck && !isEligibleProviderForProfile(b, opts.profileId))
                return false;
            return true;
        });
        if (available.length === 0)
            return [];
        const activeStrategy = opts.strategy ?? this.defaultStrategy;
        return this.applyStrategy(available, activeStrategy);
    }
    applyStrategy(candidates, strategy) {
        switch (strategy) {
            case "priority-chain":
                return candidates;
            case "round-robin": {
                const index = this.roundRobinIndex % candidates.length;
                this.roundRobinIndex++;
                const selected = candidates[index];
                return [selected, ...candidates.filter((c) => c.id !== selected.id)];
            }
            case "least-connections": {
                return [...candidates].sort((a, b) => a.active - b.active);
            }
            case "latency-optimized": {
                return [...candidates].sort((a, b) => {
                    if (a.avgLatencyMs === 0 && b.avgLatencyMs === 0)
                        return 0;
                    if (a.avgLatencyMs === 0)
                        return 1;
                    if (b.avgLatencyMs === 0)
                        return -1;
                    return a.avgLatencyMs - b.avgLatencyMs;
                });
            }
            case "weighted": {
                return this.smoothWeightedRoundRobin(candidates);
            }
            default:
                return candidates;
        }
    }
    // Nginx-style smooth weighted round-robin
    // Produces even distribution: A(5) B(3) C(2) → AABABCABCA (not AAAAABBBCC)
    smoothWeightedRoundRobin(candidates) {
        const totalWeight = candidates.reduce((sum, c) => sum + (c.config.weight ?? 1), 0);
        // Add configured weight to each candidate's current weight
        for (const c of candidates) {
            const current = this.weightedState.get(c.id) ?? 0;
            this.weightedState.set(c.id, current + (c.config.weight ?? 1));
        }
        // Pick the candidate with highest current weight
        let best = candidates[0];
        let bestWeight = this.weightedState.get(best.id) ?? 0;
        for (const c of candidates) {
            const w = this.weightedState.get(c.id) ?? 0;
            if (w > bestWeight) {
                best = c;
                bestWeight = w;
            }
        }
        // Subtract total weight from the selected candidate
        this.weightedState.set(best.id, bestWeight - totalWeight);
        // Return selected first, others as fallback
        return [best, ...candidates.filter((c) => c.id !== best.id)];
    }
}
//# sourceMappingURL=selector.js.map