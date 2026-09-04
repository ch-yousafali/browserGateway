import type { Logger } from "pino";
import type { PoolConfig, PageHandle, PoolStatus } from "./types.js";
export declare class SessionPool {
    private readonly gatewayPort;
    private readonly logger;
    private readonly config;
    private readonly token?;
    private sessions;
    private activeHandles;
    private queue;
    private maintenanceTimer;
    private closed;
    private creatingSession;
    private acquireLock;
    constructor(gatewayPort: number, logger: Logger, config: PoolConfig, token?: string | undefined);
    start(): Promise<void>;
    /**
     * Acquire a page from any pool session, or — when `opts.targetProviderId`
     * is set — open a one-shot session pinned to that provider. Pinned sessions
     * do NOT use the cached pool: the operator asked for a specific backend,
     * so we don't want to return a session that's already attached to a
     * different one.
     */
    acquirePage(opts?: {
        targetProviderId?: string;
    }): Promise<PageHandle>;
    private doAcquirePage;
    releasePage(handle: PageHandle): Promise<void>;
    /**
     * Open a fresh CDP connection pinned to the requested provider, hand back a
     * page handle that closes the underlying browser on release. Bypasses the
     * cached pool intentionally — pool sessions are anonymous (any provider),
     * and reusing one would defeat the pinning guarantee.
     *
     * The pin is enforced inside the WS-upgrade handler: we pass
     * `?provider=<id>` on the loopback connect URL and the handler refuses to
     * route anywhere else (including failover). 400/503 from the upgrade
     * surface here as a thrown Error so the caller can map to the right HTTP
     * status.
     */
    private acquirePinnedPage;
    getStatus(): PoolStatus;
    shutdown(): Promise<void>;
    private ensureCapacity;
    private createSession;
    private findAvailableSession;
    private retireSession;
    private closeSession;
    private maintenance;
    private waitForSlot;
    private dequeueNext;
    private countSessionsByState;
}
//# sourceMappingURL=session-pool.d.ts.map