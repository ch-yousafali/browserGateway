import type { Session } from "../types.js";
export declare class SessionTracker {
    private sessions;
    create(id: string, providerId: string, profileId?: string): Session;
    get(id: string): Session | undefined;
    recordActivity(id: string): void;
    remove(id: string): Session | undefined;
    getAll(): Session[];
    count(): number;
    getIdleSessions(idleTimeoutMs: number): Session[];
}
//# sourceMappingURL=session.d.ts.map