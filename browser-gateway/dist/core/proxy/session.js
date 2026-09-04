export class SessionTracker {
    sessions = new Map();
    create(id, providerId, profileId) {
        const session = {
            id,
            providerId,
            profileId,
            connectedAt: Date.now(),
            lastActivity: Date.now(),
            messageCount: 0,
        };
        this.sessions.set(id, session);
        return session;
    }
    get(id) {
        return this.sessions.get(id);
    }
    recordActivity(id) {
        const session = this.sessions.get(id);
        if (session) {
            session.lastActivity = Date.now();
            session.messageCount++;
        }
    }
    remove(id) {
        const session = this.sessions.get(id);
        if (session) {
            this.sessions.delete(id);
        }
        return session;
    }
    getAll() {
        return [...this.sessions.values()];
    }
    count() {
        return this.sessions.size;
    }
    getIdleSessions(idleTimeoutMs) {
        const now = Date.now();
        return this.getAll().filter((s) => now - s.lastActivity > idleTimeoutMs);
    }
}
//# sourceMappingURL=session.js.map