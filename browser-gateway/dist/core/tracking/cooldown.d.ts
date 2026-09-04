import type { ProviderState } from "../types.js";
interface CooldownConfig {
    defaultMs: number;
    failureThreshold: number;
    minRequestVolume: number;
}
export declare class CooldownTracker {
    private config;
    private windowMs;
    private failures;
    private successes;
    constructor(config: CooldownConfig);
    recordFailure(provider: ProviderState): void;
    recordSuccess(provider: ProviderState): void;
    isInCooldown(provider: ProviderState): boolean;
    private getWindow;
}
export {};
//# sourceMappingURL=cooldown.d.ts.map