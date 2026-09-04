import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import { CdpClient } from "./cdp-client.js";
export interface McpBrowserSession {
    sessionId: string;
    providerId: string;
    cdp: CdpClient;
    createdAt: number;
    lastActivity: number;
}
export interface LazyProviderSetup {
    (): Promise<void>;
}
export declare class McpSessionManager {
    private gateway;
    private logger;
    private sessions;
    private cleanupTimer;
    private providerSetupPromise;
    private providerSetup;
    constructor(gateway: Gateway, logger: Logger);
    setLazyProviderSetup(setup: LazyProviderSetup): void;
    private ensureProviders;
    createSession(options?: {
        timeout?: number;
    }): Promise<McpBrowserSession | null>;
    releaseSession(sessionId: string): Promise<{
        success: boolean;
        durationMs?: number;
    }>;
    getSession(sessionId: string): McpBrowserSession | undefined;
    getFirstSession(): McpBrowserSession | undefined;
    getAll(): McpBrowserSession[];
    count(): number;
    startCleanupTimer(idleTimeoutMs?: number): void;
    stopCleanupTimer(): void;
    releaseAll(): Promise<void>;
}
//# sourceMappingURL=sessions.d.ts.map