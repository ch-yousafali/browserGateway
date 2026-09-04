import WebSocket from "ws";
import { isHttpUrl, fetchCdpVersion } from "./cdp.js";
export class HealthChecker {
    registry;
    logger;
    intervalMs;
    failureThreshold;
    probeTimeoutMs;
    timer = null;
    consecutiveFailures = new Map();
    constructor(registry, logger, intervalMs = 30000, failureThreshold = 3, probeTimeoutMs = 5000) {
        this.registry = registry;
        this.logger = logger;
        this.intervalMs = intervalMs;
        this.failureThreshold = failureThreshold;
        this.probeTimeoutMs = probeTimeoutMs;
    }
    start() {
        if (this.registry.size() === 0)
            return;
        this.timer = setInterval(() => this.checkAll(), this.intervalMs);
        this.logger.info({ intervalMs: this.intervalMs, threshold: this.failureThreshold }, "health checks started");
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async checkAll() {
        const providers = this.registry.getAll();
        await Promise.allSettled(providers.map((b) => this.checkOne(b)));
    }
    async checkOne(provider) {
        const { id, config } = provider;
        try {
            if (isHttpUrl(config.url)) {
                await fetchCdpVersion(config.url, this.probeTimeoutMs);
            }
            else {
                await this.probeWebSocket(config.url);
            }
            this.consecutiveFailures.set(id, 0);
            if (!provider.healthy && !provider.cooldownUntil) {
                provider.healthy = true;
                this.logger.info({ providerId: id }, "health check recovered");
            }
        }
        catch {
            const failures = (this.consecutiveFailures.get(id) ?? 0) + 1;
            this.consecutiveFailures.set(id, failures);
            if (failures >= this.failureThreshold && provider.healthy) {
                provider.healthy = false;
                this.logger.warn({ providerId: id, consecutiveFailures: failures }, "health check failed, marking unhealthy");
            }
            else {
                this.logger.debug({ providerId: id, consecutiveFailures: failures, threshold: this.failureThreshold }, "health check failed");
            }
        }
    }
    probeWebSocket(url) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error("probe timeout"));
            }, this.probeTimeoutMs);
            const ws = new WebSocket(url, { handshakeTimeout: this.probeTimeoutMs });
            ws.on("open", () => {
                clearTimeout(timeout);
                ws.close();
                resolve();
            });
            ws.on("error", (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }
}
//# sourceMappingURL=health.js.map