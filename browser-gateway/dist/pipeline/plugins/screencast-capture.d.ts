import type { ReplayManifest, ReplayMeta } from "../../server/replay/types.js";
import type { CdpMessage, CdpPlugin, SessionState } from "../types.js";
/** Backing store the plugin writes chunked frames + metadata to. Isomorphic:
 *  Node fs impl lives in `src/server/replay/node-storage.ts`; an object-store
 *  impl can plug the same interface in later. */
export interface ReplayStorage {
    /** Called once at session start, before any writeChunk. */
    init(sessionId: string, meta: ReplayMeta): Promise<void>;
    /** Called per chunk rollover. `data` is the concatenated bytes of every
     *  frame in this chunk, each prefixed by a big-endian uint32 length header
     *  (4 bytes) — matches the on-disk format the OSS ReplayStore reader
     *  expects (`byteOffset + 4` skip). */
    writeChunk(sessionId: string, chunkIndex: number, data: Uint8Array): Promise<void>;
    /** Called once at session end. Persists the manifest + completion record.
     *  `summary.truncated` is set when capture was stopped early. The plugin
     *  itself uses `"byte-cap"` when its own per-session byte ceiling fires.
     *  When an external `stopSignal` aborts, the abort's `reason` string is
     *  used verbatim (or `"external-stop"` when the abort had no reason).
     *  Storage impls should propagate this to their metadata row so downstream
     *  surfaces (dashboard, MP4 exporter) can act on it. */
    finalize(sessionId: string, manifest: ReplayManifest, summary: {
        endedAt: number;
        frameCount: number;
        sizeBytes: number;
        droppedFrames: number;
        duplicatesSkipped: number;
        truncated?: string | null;
    }): Promise<void>;
}
export interface ScreencastCapturePluginOpts {
    sessionId: string;
    providerId: string;
    profileId?: string;
    storage: ReplayStorage;
    format: "png" | "jpeg";
    quality: number;
    everyNthFrame: number;
    maxBytesPerSession: number;
    chunkMaxBytes: number;
    chunkMaxElapsedMs: number;
    /** Cap on outstanding chunk writes; frames are dropped when exceeded. */
    maxInFlightChunks?: number;
    /** Viewport width for Page.setDeviceMetricsOverride. Required for
     *  Page.startScreencast to emit frames on stock Chromium — see
     *  puppeteer/puppeteer#10527. Defaults to 1280. */
    viewportWidth?: number;
    /** Viewport height for Page.setDeviceMetricsOverride. Defaults to 720. */
    viewportHeight?: number;
    /** Device scale factor for Page.setDeviceMetricsOverride. Defaults to 1. */
    deviceScaleFactor?: number;
    /** When true, drops frames whose `url` is the empty string (pre-navigation
     *  about:blank). Reduces manifest noise while the browser is booting. */
    filterEmptyUrl?: boolean;
    /** Optional external-stop signal. When aborted, the plugin calls
     *  Page.stopScreencast on every target and marks the manifest truncated.
     *  The `reason` passed to abort() is used verbatim as the manifest
     *  truncation label (a plain string like "wallet-drained" or "quota-hit"),
     *  or falls back to "external-stop" when abort was called without a reason.
     *  The session's byte pipe keeps running after stop; only capture stops.
     *  Leave undefined for no external stop signal (default). */
    stopSignal?: AbortSignal;
    logger?: (msg: string, data?: Record<string, unknown>) => void;
}
/** CDP screencast capture as a pipeline plugin. Rides the same CDP
 *  connection the client uses; no second WebSocket to the provider. */
export declare class ScreencastCapturePlugin implements CdpPlugin {
    private readonly opts;
    readonly name = "screencast-capture";
    private readonly maxInFlight;
    private readonly targets;
    private readonly frames;
    private droppedFrames;
    private duplicatesSkipped;
    private totalBytes;
    private capStopped;
    private truncationReason;
    private stopSignalListener;
    private started;
    private chunkIndex;
    private chunkBuffer;
    private chunkBufferBytes;
    private chunkOpenedAt;
    private pendingWrites;
    constructor(opts: ScreencastCapturePluginOpts);
    onSessionStart(state: SessionState): Promise<void>;
    private armStopSignal;
    private detachStopSignal;
    private stopCapture;
    private probeExistingTargets;
    onEvent(msg: CdpMessage, state: SessionState): void | null;
    onSessionEnd(state: SessionState, _reason: string): Promise<void>;
    private armTarget;
    private handleScreencastFrame;
    private appendFrameToBuffer;
    private flushChunk;
}
//# sourceMappingURL=screencast-capture.d.ts.map