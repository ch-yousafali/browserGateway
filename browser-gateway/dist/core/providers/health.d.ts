import type { Logger } from "pino";
import type { ProviderRegistry } from "./registry.js";
export declare class HealthChecker {
    private registry;
    private logger;
    private intervalMs;
    private failureThreshold;
    private probeTimeoutMs;
    private timer;
    private consecutiveFailures;
    constructor(registry: ProviderRegistry, logger: Logger, intervalMs?: number, failureThreshold?: number, probeTimeoutMs?: number);
    start(): void;
    stop(): void;
    private checkAll;
    private checkOne;
    private probeWebSocket;
}
//# sourceMappingURL=health.d.ts.map