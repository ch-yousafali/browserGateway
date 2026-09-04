import { Hono } from "hono";
import type { Logger } from "pino";
import type { ReplayStore } from "../replay/index.js";
import type { GatewayConfig } from "../../core/types.js";
interface ReplayRoutesDeps {
    store: ReplayStore;
    logger: Logger;
    config?: GatewayConfig;
    dataDir?: string;
}
export declare function createReplayRoutes(deps: ReplayRoutesDeps): Hono;
export {};
//# sourceMappingURL=replays.d.ts.map