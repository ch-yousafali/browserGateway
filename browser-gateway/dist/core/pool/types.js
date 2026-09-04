import { z } from "zod";
export const PoolConfigSchema = z.object({
    minSessions: z.number().int().min(0).default(0),
    maxSessions: z.number().int().min(1).default(5),
    maxPagesPerSession: z.number().int().min(1).default(10),
    retireAfterPages: z.number().int().min(1).default(100),
    retireAfterMs: z.number().int().min(10000).default(3600000),
    idleTimeoutMs: z.number().int().min(5000).default(300000),
    pageTimeoutMs: z.number().int().min(1000).default(30000),
});
//# sourceMappingURL=types.js.map