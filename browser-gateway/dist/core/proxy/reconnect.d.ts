export interface ParkedSession {
    sessionId: string;
    providerId: string;
    providerUrl: string;
    parkedAt: number;
    originalConnectedAt: number;
    messageCount: number;
}
export declare class ReconnectRegistry {
    private parked;
    private cleanupTimer;
    park(sessionId: string, providerId: string, providerUrl: string, connectedAt: number, messageCount: number): void;
    claim(sessionId: string): ParkedSession | undefined;
    get(sessionId: string): ParkedSession | undefined;
    has(sessionId: string): boolean;
    count(): number;
    getAll(): ParkedSession[];
    startCleanup(ttlMs: number): void;
    stopCleanup(): void;
}
//# sourceMappingURL=reconnect.d.ts.map