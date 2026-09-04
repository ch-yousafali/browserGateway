import { EventEmitter } from "node:events";
import type { Logger } from "pino";
import type { GatewayConfig, ProviderState } from "./types.js";
import { ProviderRegistry } from "./providers/registry.js";
import { HealthChecker } from "./providers/health.js";
import { ProviderSelector } from "./router/selector.js";
import { ConcurrencyTracker } from "./tracking/concurrency.js";
import { CooldownTracker } from "./tracking/cooldown.js";
import { SessionTracker } from "./proxy/session.js";
/**
 * Map of events emitted by the {@link Gateway} class. Useful for typing
 * `gateway.on("event-name", handler)` consumers, even though EventEmitter
 * doesn't enforce these types at runtime.
 *
 * @public
 */
export interface GatewayEvents {
    "session.created": {
        sessionId: string;
        providerId: string;
    };
    "session.ended": {
        sessionId: string;
        providerId: string;
        durationMs: number;
    };
    "provider.down": {
        providerId: string;
        reason: string;
    };
    "provider.up": {
        providerId: string;
    };
    "provider.cooldown": {
        providerId: string;
        cooldownMs: number;
    };
    "queue.added": {
        position: number;
        total: number;
    };
    "queue.timeout": {
        waitMs: number;
    };
    "shutdown.start": {};
    "shutdown.draining": {
        activeSessions: number;
    };
    "shutdown.complete": {};
}
export declare class Gateway extends EventEmitter {
    readonly config: GatewayConfig;
    readonly registry: ProviderRegistry;
    readonly selector: ProviderSelector;
    readonly concurrency: ConcurrencyTracker;
    readonly cooldown: CooldownTracker;
    readonly sessions: SessionTracker;
    readonly healthChecker: HealthChecker;
    readonly logger: Logger;
    private reconcileTimer;
    private idleCheckTimer;
    private onIdleSession?;
    private queue;
    private _shuttingDown;
    get shuttingDown(): boolean;
    get queueSize(): number;
    constructor(config: GatewayConfig, logger: Logger);
    selectProvider(targetProviderId?: string, profileId?: string | null, readOnly?: boolean): ProviderState | null;
    selectProviderWithFallbacks(targetProviderId?: string, profileId?: string | null, readOnly?: boolean): ProviderState[];
    acquireSlot(providerId: string, sessionId: string): boolean;
    releaseSlot(sessionId: string, providerId: string): void;
    recordSuccess(providerId: string, latencyMs: number): void;
    recordFailure(providerId: string): void;
    waitForSlot(timeoutMs?: number, targetProviderId?: string, profileId?: string | null): Promise<boolean>;
    private dequeueNext;
    private drainQueue;
    gracefulShutdown(drainTimeoutMs?: number): Promise<void>;
    getStatus(): {
        providers: ProviderState[];
        activeSessions: number;
        strategy: string;
        queueSize: number;
        shuttingDown: boolean;
    };
    setIdleSessionHandler(handler: (sessionId: string) => void): void;
    start(): void;
    stop(): void;
    private maskUrl;
}
//# sourceMappingURL=gateway.d.ts.map