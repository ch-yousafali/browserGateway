export class CooldownTracker {
    config;
    windowMs = 60_000;
    failures = new Map();
    successes = new Map();
    constructor(config) {
        this.config = config;
    }
    recordFailure(provider) {
        const now = Date.now();
        const fails = this.getWindow(this.failures, provider.id, now);
        fails.push(now);
        provider.failureCount++;
        provider.lastFailure = now;
        const successCount = this.getWindow(this.successes, provider.id, now).length;
        const totalCount = fails.length + successCount;
        if (totalCount < this.config.minRequestVolume)
            return;
        const failureRate = fails.length / totalCount;
        const threshold = this.config.failureThreshold;
        if (failureRate >= threshold) {
            provider.cooldownUntil = now + this.config.defaultMs;
            provider.healthy = false;
        }
    }
    recordSuccess(provider) {
        const now = Date.now();
        const wins = this.getWindow(this.successes, provider.id, now);
        wins.push(now);
        provider.successCount++;
        if (provider.cooldownUntil && now >= provider.cooldownUntil) {
            provider.cooldownUntil = null;
            provider.healthy = true;
        }
    }
    isInCooldown(provider) {
        if (!provider.cooldownUntil)
            return false;
        if (Date.now() >= provider.cooldownUntil) {
            provider.cooldownUntil = null;
            provider.healthy = true;
            return false;
        }
        return true;
    }
    getWindow(store, providerId, now) {
        let entries = store.get(providerId);
        if (!entries) {
            entries = [];
            store.set(providerId, entries);
        }
        const cutoff = now - this.windowMs;
        const filtered = entries.filter((t) => t > cutoff);
        store.set(providerId, filtered);
        return filtered;
    }
}
//# sourceMappingURL=cooldown.js.map