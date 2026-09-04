import type { PipelineOptions, PipelineResult } from "./types.js";
/** Minimal WebSocket contract the pipeline needs. Both `ws` (Node) and CF
 *  Workers `WebSocket` conform. Node's `ws` uses `on`, browser/Workers use
 *  `addEventListener` — we support both by feature-detecting. */
export interface PipelineSocket {
    send(data: string | ArrayBuffer | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
    addEventListener?(type: string, listener: (ev: unknown) => void): void;
    on?(event: string, listener: (data: unknown) => void): void;
    readonly bufferedAmount?: number;
}
/** Outcome of {@link Pipeline.start}. */
export type PipelineStartResult = {
    ok: true;
} | {
    ok: false;
    plugin: string;
    error?: unknown;
};
/** CDP-aware bidirectional relay. Two-phase lifecycle:
 *  1. {@link Pipeline.start} — attaches the upstream side, runs every
 *     plugin's `onSessionStart`. Fails fast if any plugin errors; the
 *     upstream is closed and no `onSessionEnd` runs. Callers use this to
 *     probe whether the provider can serve the session before committing
 *     to a client upgrade — enables failover.
 *  2. {@link Pipeline.run} — attaches the client (or runs solo), pumps
 *     bytes, runs `onSessionEnd` for every plugin on close. */
export declare class Pipeline {
    private client;
    private readonly upstream;
    private readonly plugins;
    private readonly logger;
    private readonly onSessionStartTimeoutMs;
    private readonly onSessionEndTimeoutMs;
    private readonly dropThresholdBytes;
    private readonly maxSessionMs?;
    private readonly idleTimeoutMs?;
    private readonly onActivity?;
    private readonly activityThrottleMs;
    private lastReportedActivityAt;
    private readonly ids;
    private readonly state;
    private readonly counters;
    private started;
    private closed;
    private lastClientActivityAt;
    private maxTimer;
    private idleTimer;
    private resolveResult;
    constructor(upstream: PipelineSocket, upstreamUrl: string, opts: PipelineOptions);
    /** Phase 1. Attaches upstream listeners and runs plugin `onSessionStart`
     *  in order. On any plugin throw, closes the upstream and returns
     *  `{ok:false, plugin}`. `onSessionEnd` does NOT run on start failure. */
    start(): Promise<PipelineStartResult>;
    /** Phase 2. Attaches the client (or null for solo mode), starts timers,
     *  awaits close, runs `onSessionEnd` for every plugin, resolves. Must
     *  be called after a successful {@link Pipeline.start}. */
    run(client: PipelineSocket | null): Promise<PipelineResult>;
    private attachUpstreamListeners;
    private attachClientListeners;
    private startTimers;
    private reportActivity;
    private onClientMessage;
    private onUpstreamMessage;
    private finalize;
    private runOnSessionEnd;
}
//# sourceMappingURL=pipeline.d.ts.map