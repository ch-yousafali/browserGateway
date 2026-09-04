import { z } from "zod";
import type { Browser, BrowserContext, Page } from "playwright-core";
export declare const PoolConfigSchema: z.ZodObject<{
    minSessions: z.ZodDefault<z.ZodNumber>;
    maxSessions: z.ZodDefault<z.ZodNumber>;
    maxPagesPerSession: z.ZodDefault<z.ZodNumber>;
    retireAfterPages: z.ZodDefault<z.ZodNumber>;
    retireAfterMs: z.ZodDefault<z.ZodNumber>;
    idleTimeoutMs: z.ZodDefault<z.ZodNumber>;
    pageTimeoutMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type PoolConfig = z.infer<typeof PoolConfigSchema>;
export type SessionState = "starting" | "active" | "retiring" | "closed";
export interface PoolSession {
    id: string;
    browser: Browser;
    state: SessionState;
    activePages: number;
    totalPagesServed: number;
    createdAt: number;
    lastActivity: number;
}
export interface PageHandle {
    id: string;
    page: Page;
    context: BrowserContext;
    sessionId: string;
    acquiredAt: number;
}
export interface PoolStatus {
    totalSessions: number;
    activeSessions: number;
    retiringSessions: number;
    totalActivePages: number;
    config: PoolConfig;
    sessions: Array<{
        id: string;
        state: SessionState;
        activePages: number;
        totalPagesServed: number;
        uptime: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map