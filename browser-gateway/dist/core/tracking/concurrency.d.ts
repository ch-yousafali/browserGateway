import type { ProviderState } from "../types.js";
export declare class ConcurrencyTracker {
    private sessions;
    acquire(providerId: string, sessionId: string, provider: ProviderState): boolean;
    release(sessionId: string, provider: ProviderState): void;
    getActive(providerId: string): number;
    reconcile(providers: Map<string, ProviderState>, maxAgeMs: number): number;
}
//# sourceMappingURL=concurrency.d.ts.map