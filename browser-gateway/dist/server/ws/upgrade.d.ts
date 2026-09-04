import { IncomingMessage } from "node:http";
import { Duplex } from "node:stream";
import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { RelayTransport } from "../../core/transport.js";
import type { ReconnectRegistry } from "../../core/proxy/reconnect.js";
import { type ProfileLifecycle } from "../profile/lifecycle.js";
import type { ReplayConfig } from "../../core/types.js";
export interface PipelineReplayContext {
    storePath: string;
    replayConfig: ReplayConfig;
}
export declare function createWebSocketHandler(gateway: Gateway, logger: Logger, token?: string, reconnectRegistry?: ReconnectRegistry, profileLifecycle?: ProfileLifecycle, transport?: RelayTransport, pipelineReplay?: PipelineReplayContext): {
    handleUpgrade: (req: IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>;
};
//# sourceMappingURL=upgrade.d.ts.map