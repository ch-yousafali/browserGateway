export class ReconnectRegistry {
    parked = new Map();
    cleanupTimer = null;
    park(sessionId, providerId, providerUrl, connectedAt, messageCount) {
        this.parked.set(sessionId, {
            sessionId,
            providerId,
            providerUrl,
            parkedAt: Date.now(),
            originalConnectedAt: connectedAt,
            messageCount,
        });
    }
    claim(sessionId) {
        const entry = this.parked.get(sessionId);
        if (entry) {
            this.parked.delete(sessionId);
        }
        return entry;
    }
    get(sessionId) {
        return this.parked.get(sessionId);
    }
    has(sessionId) {
        return this.parked.has(sessionId);
    }
    count() {
        return this.parked.size;
    }
    getAll() {
        return Array.from(this.parked.values());
    }
    startCleanup(ttlMs) {
        if (this.cleanupTimer)
            return;
        this.cleanupTimer = setInterval(() => {
            const now = Date.now();
            for (const [id, entry] of this.parked) {
                if (now - entry.parkedAt > ttlMs) {
                    this.parked.delete(id);
                }
            }
        }, 15000);
    }
    stopCleanup() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
    }
}
//# sourceMappingURL=reconnect.js.map