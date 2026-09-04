/** WS /v1/live upgrade handler. Runs the CDP-aware pipeline in solo mode:
 *  no CDP client peer — the viewer speaks the LIVE protocol via
 *  ScreencastBridgePlugin, and profile inject/capture rides the same pipeline
 *  via ProfilePlugin when `?profile=` is present. */
import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import { type ProfileLifecycle } from "../profile/lifecycle.js";
export interface CreateLiveHandlerDeps {
    gateway: Gateway;
    logger: Logger;
    token?: string;
    profileLifecycle?: ProfileLifecycle;
}
export declare function createLiveUpgradeHandler(deps: CreateLiveHandlerDeps): {
    handle: (req: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>;
};
//# sourceMappingURL=upgrade.d.ts.map