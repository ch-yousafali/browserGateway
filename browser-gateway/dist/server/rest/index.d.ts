import { Hono } from "hono";
import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { SessionPool } from "../../core/pool/index.js";
import type { ProfileLifecycle } from "../profile/lifecycle.js";
export declare function createRestRoutes(pool: SessionPool, gateway: Gateway, logger: Logger, profileLifecycle?: ProfileLifecycle): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
//# sourceMappingURL=index.d.ts.map