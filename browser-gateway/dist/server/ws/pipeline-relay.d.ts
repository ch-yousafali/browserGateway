import type { IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";
import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { ProviderState } from "../../core/types.js";
import type { ReconnectRegistry } from "../../core/proxy/reconnect.js";
import type { CdpPlugin } from "../../pipeline/types.js";
import { ProfileResidueError } from "../../pipeline/plugins/profile.js";
export interface PipelineRelayOpts {
    gateway: Gateway;
    logger: Logger;
    req: IncomingMessage;
    socket: Duplex;
    head: Buffer;
    provider: ProviderState;
    sessionId: string;
    plugins: CdpPlugin[];
    reconnectRegistry?: ReconnectRegistry;
}
export type PipelineRelayResult = {
    connected: true;
} | {
    connected: false;
    residue?: ProfileResidueError;
};
/** Two-phase pipeline handoff for `/v1/connect`:
 *  1. Open upstream WS and run every plugin's `onSessionStart` (which may
 *     dispatch inject commands). If any plugin fails, upstream is closed
 *     and the client socket is NEVER upgraded — the caller retries with
 *     the next provider. A {@link ProfileResidueError} is surfaced back
 *     so the caller can convert it to HTTP 409 instead of a generic 503.
 *  2. Upgrade the client, attach it to the pipeline, run the byte relay. */
export declare function handlePipelineRelay(opts: PipelineRelayOpts): Promise<PipelineRelayResult>;
//# sourceMappingURL=pipeline-relay.d.ts.map