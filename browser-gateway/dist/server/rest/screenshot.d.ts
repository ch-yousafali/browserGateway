import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { SessionPool } from "../../core/pool/index.js";
import type { ProfileLifecycle } from "../profile/lifecycle.js";
import type { Context } from "hono";
export declare function handleScreenshot(c: Context, pool: SessionPool, gateway: Gateway, logger: Logger, profileLifecycle?: ProfileLifecycle): Promise<Response>;
//# sourceMappingURL=screenshot.d.ts.map