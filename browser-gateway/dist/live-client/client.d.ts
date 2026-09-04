/**
 * Browser-side client for the gateway's `/v1/live` WebSocket.
 *
 * Protocol shape lives in `./protocol.ts`. Both OSS gateway dashboard and the
 * SaaS cloud playground import this class — one implementation, zero drift.
 *
 * Server→client: binary WS frames carry JPEG bytes; JSON text frames carry
 * control messages (`frameMeta`, `url`, `error`). Client→server: JSON text
 * frames for mouse / key / navigate / close / setViewport / paste.
 *
 * No automatic reconnect. If the connection dies the UI surfaces the error
 * and the user reconnects manually.
 */
export interface FrameMeta {
    deviceWidth: number;
    deviceHeight: number;
    scrollX: number;
    scrollY: number;
}
export interface LiveClientEvents {
    onFrame: (bitmap: ImageBitmap, meta: FrameMeta) => void;
    onUrl: (url: string) => void;
    onError: (code: string, message: string) => void;
    onClose: (info: {
        code: number;
        reason: string;
    }) => void;
    onOpen: () => void;
    /** Fired when the server signals the keep-alive window is about to expire.
     *  Optional; hosts that don't opt in to `keepAliveSeconds` can ignore it. */
    onExpiring?: (secondsRemaining: number) => void;
    /** Fired when the server has hit the keep-alive limit. A close follows. */
    onExpired?: () => void;
}
export interface ConnectOpts {
    /** Base WS URL — e.g. `wss://cdp.browsergateway.io`. Derived from
     *  `window.location` when omitted. Set this on SaaS where the router lives
     *  on a different host than the dashboard. */
    wsBase?: string;
    /** Required: the chosen provider id. */
    provider: string;
    /** Optional profile id. When set, server injects cookies/storage. */
    profile?: string;
    /** Optional read-only profile flag — no lock, no writeback. */
    readOnly?: boolean;
    /** Auth token. In OSS this is `BG_TOKEN`; in SaaS this is a `bg_` router key. */
    token?: string | null;
    /** Screencast tuning — server enforces clamps. */
    format?: "jpeg" | "png";
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    everyNthFrame?: number;
    /** Hard session-duration cap in seconds. Server clamps to [60, 1200]. Omit
     *  to disable. When enabled, the server sends `expiring` at T-30s and
     *  `expired` at T-0, then closes the connection. */
    keepAliveSeconds?: number;
}
export declare class LiveClient {
    private ws;
    private currentMeta;
    private listeners;
    private closed;
    constructor(listeners: LiveClientEvents);
    connect(opts: ConnectOpts): void;
    private isProcessingFrame;
    private pendingFrameBuffer;
    private pendingFrameDropped;
    private handleBinaryFrame;
    private drainFrames;
    private decodeAndDeliver;
    private handleControlMessage;
    isOpen(): boolean;
    getMeta(): FrameMeta | null;
    sendMouse(opts: {
        kind: "press" | "release" | "move" | "wheel";
        x: number;
        y: number;
        button?: "left" | "right" | "middle" | "none";
        modifiers?: number;
        clickCount?: number;
        deltaX?: number;
        deltaY?: number;
    }): void;
    sendKey(opts: {
        kind: "down" | "up" | "char";
        text?: string;
        code?: string;
        key?: string;
        keyCode?: number;
        modifiers?: number;
    }): void;
    /** Paste text into the focused field on the remote page. Uses CDP
     *  Input.insertText (one shot, no per-character key dispatch). Server caps
     *  length at 64 KB. */
    sendPaste(text: string): void;
    navigate(url: string): void;
    navAction(action: "back" | "forward" | "reload"): void;
    setViewport(width: number, height: number): void;
    close(): void;
    private send;
}
/**
 * Convert a browser KeyboardEvent / MouseEvent / WheelEvent into the modifier
 * bitmask CDP expects. Exported so consumers can reuse it for both keydown and
 * mousedown paths.
 */
export declare function eventModifiers(e: KeyboardEvent | MouseEvent | WheelEvent): number;
/** Map a DOM `MouseEvent.button` (0/1/2) to our protocol button name. */
export declare function mouseButton(button: number): "left" | "right" | "middle";
//# sourceMappingURL=client.d.ts.map