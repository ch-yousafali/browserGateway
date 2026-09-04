import type { PipelineSocket } from "../pipeline.js";
import type { CdpMessage, CdpPlugin, SessionState } from "../types.js";
export interface ScreencastBridgePluginOpts {
    viewer: PipelineSocket;
    format?: "jpeg" | "png";
    quality?: number;
    viewportWidth?: number;
    viewportHeight?: number;
    everyNthFrame?: number;
    deviceScaleFactor?: number;
    /** Drop frames when the viewer's buffered bytes exceeds this. */
    dropThresholdBytes?: number;
    /** Hard session-duration cap in seconds. 0 disables. When set, a warn
     *  control fires 30s before, then session terminates. */
    keepAliveSeconds?: number;
    logger?: (msg: string, data?: Record<string, unknown>) => void;
}
/** CDP screencast → viewer socket bridge as a pipeline plugin. Creates a
 *  fresh `about:blank` target on session start, attaches to it, and pumps
 *  screencast frames to a viewer WebSocket. Accepts viewer input messages
 *  (mouse / key / navigate / setViewport / paste / close) and dispatches
 *  them upstream via `state.sendInternal`. Works in Node (with `ws`) and
 *  Cloudflare Workers (with the platform WebSocket) — both conform to the
 *  {@link PipelineSocket} contract. */
export declare class ScreencastBridgePlugin implements CdpPlugin {
    readonly name = "screencast-bridge";
    private readonly opts;
    private cdpSessionId;
    private targetId;
    private stateRef;
    private closed;
    private framesSent;
    private framesDropped;
    private lastMeta;
    private expireTimer;
    private warnTimer;
    private viewerAttached;
    constructor(opts: ScreencastBridgePluginOpts);
    getStats(): {
        framesSent: number;
        framesDropped: number;
    };
    /** Exposed so other plugins (e.g. profile inject) can piggy-back on the
     *  same attached target. `null` until `onSessionStart` completes. */
    getSessionId(): string | null;
    onSessionStart(state: SessionState): Promise<void>;
    onEvent(msg: CdpMessage, state: SessionState): void | null;
    onSessionEnd(state: SessionState, _reason: string): Promise<void>;
    private handleScreencastFrame;
    private maybeSendFrameMeta;
    private forwardFrame;
    private sendControl;
    private attachViewer;
    private handleViewerMessage;
    private dispatchClientMessage;
    private startKeepAliveTimers;
}
//# sourceMappingURL=screencast-bridge.d.ts.map