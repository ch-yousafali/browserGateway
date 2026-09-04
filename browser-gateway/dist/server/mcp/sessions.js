import { randomUUID } from "node:crypto";
import { CdpClient } from "./cdp-client.js";
export class McpSessionManager {
    gateway;
    logger;
    sessions = new Map();
    cleanupTimer = null;
    providerSetupPromise;
    providerSetup;
    constructor(gateway, logger) {
        this.gateway = gateway;
        this.logger = logger;
    }
    setLazyProviderSetup(setup) {
        this.providerSetup = setup;
    }
    async ensureProviders() {
        if (this.gateway.registry.size() > 0)
            return;
        if (!this.providerSetup)
            return;
        if (!this.providerSetupPromise) {
            this.providerSetupPromise = this.providerSetup().catch((e) => {
                this.providerSetupPromise = undefined;
                throw e;
            });
        }
        await this.providerSetupPromise;
    }
    async createSession(options) {
        await this.ensureProviders();
        const sessionId = randomUUID();
        const timeout = options?.timeout ?? this.gateway.config.gateway.queue?.timeoutMs ?? 30000;
        const tryAcquire = async () => {
            const candidates = this.gateway.selectProviderWithFallbacks();
            for (const provider of candidates) {
                if (!this.gateway.acquireSlot(provider.id, sessionId)) {
                    continue;
                }
                const cdp = new CdpClient();
                try {
                    await cdp.connect(provider.config.url, this.gateway.config.gateway.connectionTimeout);
                    await cdp.enableDomains();
                    const session = {
                        sessionId,
                        providerId: provider.id,
                        cdp,
                        createdAt: Date.now(),
                        lastActivity: Date.now(),
                    };
                    this.sessions.set(sessionId, session);
                    this.gateway.recordSuccess(provider.id, Date.now() - session.createdAt);
                    this.logger.info({ sessionId, providerId: provider.id }, "mcp browser session created");
                    return session;
                }
                catch (err) {
                    cdp.close();
                    this.gateway.releaseSlot(sessionId, provider.id);
                    this.gateway.recordFailure(provider.id);
                    this.logger.warn({ sessionId, providerId: provider.id, error: err.message }, "failed to connect to provider, trying next");
                }
            }
            return null;
        };
        const result = await tryAcquire();
        if (result)
            return result;
        const slotAvailable = await this.gateway.waitForSlot(timeout);
        if (slotAvailable) {
            return tryAcquire();
        }
        this.logger.warn({ sessionId }, "mcp session creation failed - all providers unavailable");
        return null;
    }
    async releaseSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false };
        }
        const durationMs = Date.now() - session.createdAt;
        try {
            await session.cdp.send("Browser.close").catch(() => { });
        }
        catch { }
        session.cdp.close();
        this.sessions.delete(sessionId);
        this.gateway.releaseSlot(sessionId, session.providerId);
        this.logger.info({ sessionId, providerId: session.providerId, durationMs }, "mcp session released");
        return { success: true, durationMs };
    }
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
        return session;
    }
    getFirstSession() {
        const first = this.sessions.values().next();
        if (first.done)
            return undefined;
        first.value.lastActivity = Date.now();
        return first.value;
    }
    getAll() {
        return Array.from(this.sessions.values());
    }
    count() {
        return this.sessions.size;
    }
    startCleanupTimer(idleTimeoutMs = 300000) {
        if (this.cleanupTimer)
            return;
        this.cleanupTimer = setInterval(async () => {
            const now = Date.now();
            for (const [id, session] of this.sessions) {
                if (now - session.lastActivity > idleTimeoutMs) {
                    this.logger.info({ sessionId: id }, "mcp session idle - releasing");
                    await this.releaseSession(id);
                }
            }
        }, 30000);
    }
    stopCleanupTimer() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
    async releaseAll() {
        for (const [id] of this.sessions) {
            await this.releaseSession(id);
        }
    }
}
//# sourceMappingURL=sessions.js.map