import { EventEmitter } from "node:events";
import { ProviderRegistry } from "./providers/registry.js";
import { HealthChecker } from "./providers/health.js";
import { ProviderSelector, isEligibleForProfile } from "./router/selector.js";
import { ConcurrencyTracker } from "./tracking/concurrency.js";
import { CooldownTracker } from "./tracking/cooldown.js";
import { SessionTracker } from "./proxy/session.js";
export class Gateway extends EventEmitter {
    config;
    registry;
    selector;
    concurrency;
    cooldown;
    sessions;
    healthChecker;
    logger;
    reconcileTimer = null;
    idleCheckTimer = null;
    onIdleSession;
    queue = [];
    _shuttingDown = false;
    get shuttingDown() {
        return this._shuttingDown;
    }
    get queueSize() {
        return this.queue.length;
    }
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.registry = new ProviderRegistry();
        this.concurrency = new ConcurrencyTracker();
        this.cooldown = new CooldownTracker(config.gateway.cooldown);
        this.sessions = new SessionTracker();
        for (const [id, providerConfig] of Object.entries(config.providers)) {
            this.registry.register(id, providerConfig);
            this.logger.info({ providerId: id, url: this.maskUrl(providerConfig.url) }, "provider registered");
        }
        this.selector = new ProviderSelector(this.registry, this.cooldown, config.gateway.defaultStrategy);
        this.healthChecker = new HealthChecker(this.registry, this.logger, config.gateway.healthCheckInterval);
        this.logger.info({ providers: this.registry.size(), strategy: config.gateway.defaultStrategy }, "gateway initialized");
    }
    selectProvider(targetProviderId, profileId, readOnly) {
        const candidates = this.selector.getCandidates({ targetProviderId, profileId, readOnly });
        return candidates[0] ?? null;
    }
    selectProviderWithFallbacks(targetProviderId, profileId, readOnly) {
        return this.selector.getCandidates({ targetProviderId, profileId, readOnly });
    }
    acquireSlot(providerId, sessionId) {
        const provider = this.registry.get(providerId);
        if (!provider)
            return false;
        return this.concurrency.acquire(providerId, sessionId, provider);
    }
    releaseSlot(sessionId, providerId) {
        const provider = this.registry.get(providerId);
        if (!provider)
            return;
        this.concurrency.release(sessionId, provider);
        this.dequeueNext();
    }
    recordSuccess(providerId, latencyMs) {
        const provider = this.registry.get(providerId);
        if (!provider)
            return;
        this.cooldown.recordSuccess(provider);
        const alpha = 0.3;
        provider.avgLatencyMs = provider.avgLatencyMs === 0
            ? latencyMs
            : alpha * latencyMs + (1 - alpha) * provider.avgLatencyMs;
    }
    recordFailure(providerId) {
        const provider = this.registry.get(providerId);
        if (!provider)
            return;
        const wasCooledDown = !!provider.cooldownUntil;
        this.cooldown.recordFailure(provider);
        if (provider.cooldownUntil && !wasCooledDown) {
            this.emit("provider.cooldown", {
                providerId,
                cooldownMs: provider.cooldownUntil - Date.now(),
            });
        }
        this.logger.warn({
            providerId,
            failureCount: provider.failureCount,
            cooldownUntil: provider.cooldownUntil,
        }, provider.cooldownUntil ? "provider entered cooldown" : "provider failure recorded");
    }
    // --- Queue ---
    async waitForSlot(timeoutMs, targetProviderId, profileId) {
        if (this._shuttingDown)
            return false;
        const candidates = this.selector.getCandidates({ targetProviderId, profileId });
        if (candidates.length > 0)
            return true;
        // Pinned but provider doesn't exist OR is in cooldown — no point queuing,
        // it'll never unblock. Bail fast so the caller can 503 with the right reason.
        if (targetProviderId !== undefined) {
            const pinned = this.registry.get(targetProviderId);
            if (!pinned || this.cooldown.isInCooldown(pinned))
                return false;
        }
        // No provider is currently configured to serve this request's profile
        // eligibility. Queue resolution will never fire — every eligibility check
        // will return empty. Bail fast so the caller can respond with a clear
        // error instead of hanging until the queue timeout.
        const anyEligible = this.registry
            .getAll()
            .some((p) => isEligibleForProfile(p.config, profileId));
        if (!anyEligible)
            return false;
        const maxQueue = this.config.gateway.queue?.maxSize ?? 50;
        const queueTimeout = timeoutMs ?? this.config.gateway.queue?.timeoutMs ?? 30000;
        if (this.queue.length >= maxQueue) {
            this.logger.warn({ queueSize: this.queue.length, maxQueue }, "queue full, rejecting");
            return false;
        }
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                const idx = this.queue.findIndex((e) => e.resolve === resolve);
                if (idx !== -1)
                    this.queue.splice(idx, 1);
                this.logger.debug({ waitMs: queueTimeout, targetProviderId, profileId }, "queue timeout");
                this.emit("queue.timeout", { waitMs: queueTimeout });
                resolve(false);
            }, queueTimeout);
            this.queue.push({ resolve, enqueuedAt: Date.now(), timer, targetProviderId, profileId });
            this.logger.info({ position: this.queue.length, total: this.queue.length, targetProviderId, profileId }, "request queued");
            this.emit("queue.added", { position: this.queue.length, total: this.queue.length });
        });
    }
    dequeueNext() {
        if (this.queue.length === 0)
            return;
        // Walk the queue and resolve the first entry whose constraint is satisfied
        // by current capacity. Pinned entries only resolve if THEIR provider has
        // a slot; unpinned entries resolve if ANY provider does.
        for (let i = 0; i < this.queue.length; i++) {
            const entry = this.queue[i];
            const candidates = this.selector.getCandidates({
                targetProviderId: entry.targetProviderId,
                profileId: entry.profileId,
            });
            if (candidates.length === 0)
                continue;
            this.queue.splice(i, 1);
            clearTimeout(entry.timer);
            const waitMs = Date.now() - entry.enqueuedAt;
            this.logger.info({
                waitMs,
                remaining: this.queue.length,
                targetProviderId: entry.targetProviderId,
                profileId: entry.profileId,
            }, "request dequeued");
            entry.resolve(true);
            return;
        }
    }
    drainQueue() {
        for (const entry of this.queue) {
            clearTimeout(entry.timer);
            entry.resolve(false);
        }
        this.queue = [];
    }
    // --- Shutdown ---
    async gracefulShutdown(drainTimeoutMs) {
        if (this._shuttingDown)
            return;
        this._shuttingDown = true;
        const timeout = drainTimeoutMs ?? this.config.gateway.shutdownDrainMs ?? 30000;
        this.logger.info("graceful shutdown initiated");
        this.emit("shutdown.start", {});
        this.drainQueue();
        const activeSessions = this.sessions.count();
        if (activeSessions > 0) {
            this.logger.info({ activeSessions, drainTimeoutMs: timeout }, "draining active sessions");
            this.emit("shutdown.draining", { activeSessions });
            await new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (this.sessions.count() === 0) {
                        clearInterval(checkInterval);
                        clearTimeout(forceTimer);
                        resolve();
                    }
                }, 500);
                const forceTimer = setTimeout(() => {
                    clearInterval(checkInterval);
                    const remaining = this.sessions.count();
                    if (remaining > 0) {
                        this.logger.warn({ remaining }, "drain timeout, force closing remaining sessions");
                    }
                    resolve();
                }, timeout);
            });
        }
        this.stop();
        this.logger.info("graceful shutdown complete");
        this.emit("shutdown.complete", {});
    }
    // --- Status ---
    getStatus() {
        return {
            providers: this.registry.getAll(),
            activeSessions: this.sessions.count(),
            strategy: this.config.gateway.defaultStrategy,
            queueSize: this.queue.length,
            shuttingDown: this._shuttingDown,
        };
    }
    setIdleSessionHandler(handler) {
        this.onIdleSession = handler;
    }
    start() {
        this.reconcileTimer = setInterval(() => {
            const providers = new Map(this.registry.getAll().map((b) => [b.id, b]));
            const cleaned = this.concurrency.reconcile(providers, this.config.gateway.sessions.idleTimeoutMs * 2);
            if (cleaned > 0) {
                this.logger.warn({ cleaned }, "reconciled stale concurrency entries");
            }
        }, 30_000);
        const idleTimeoutMs = this.config.gateway.sessions.idleTimeoutMs;
        this.idleCheckTimer = setInterval(() => {
            const idleSessions = this.sessions.getIdleSessions(idleTimeoutMs);
            for (const session of idleSessions) {
                this.logger.warn({ sessionId: session.id, providerId: session.providerId, idleMs: Date.now() - session.lastActivity }, "terminating idle session");
                this.onIdleSession?.(session.id);
            }
        }, Math.min(idleTimeoutMs, 30_000));
        this.healthChecker.start();
        this.logger.info("gateway started");
    }
    stop() {
        this.healthChecker.stop();
        if (this.reconcileTimer)
            clearInterval(this.reconcileTimer);
        if (this.idleCheckTimer)
            clearInterval(this.idleCheckTimer);
        this.logger.info("gateway stopped");
    }
    maskUrl(url) {
        try {
            const parsed = new URL(url);
            for (const [key] of parsed.searchParams) {
                parsed.searchParams.set(key, "***");
            }
            return parsed.toString();
        }
        catch {
            return "***";
        }
    }
}
//# sourceMappingURL=gateway.js.map