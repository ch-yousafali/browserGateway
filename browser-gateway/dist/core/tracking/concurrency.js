import { effectiveMaxConcurrent } from "../providers/effective.js";
export class ConcurrencyTracker {
    sessions = new Map();
    acquire(providerId, sessionId, provider) {
        const maxConcurrent = effectiveMaxConcurrent(provider);
        if (maxConcurrent && provider.active >= maxConcurrent) {
            return false;
        }
        this.sessions.set(sessionId, { providerId, timestamp: Date.now() });
        provider.active++;
        provider.totalConnections++;
        return true;
    }
    release(sessionId, provider) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        this.sessions.delete(sessionId);
        provider.active = Math.max(0, provider.active - 1);
    }
    getActive(providerId) {
        let count = 0;
        for (const session of this.sessions.values()) {
            if (session.providerId === providerId)
                count++;
        }
        return count;
    }
    reconcile(providers, maxAgeMs) {
        const now = Date.now();
        let cleaned = 0;
        for (const [sessionId, session] of this.sessions) {
            if (now - session.timestamp > maxAgeMs) {
                const provider = providers.get(session.providerId);
                if (provider) {
                    provider.active = Math.max(0, provider.active - 1);
                }
                this.sessions.delete(sessionId);
                cleaned++;
            }
        }
        return cleaned;
    }
}
//# sourceMappingURL=concurrency.js.map