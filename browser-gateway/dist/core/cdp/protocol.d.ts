/** Pure CDP protocol layer — request/response matching + event emission over a pluggable transport. Isomorphic. */
export interface CdpTransport {
    send(data: string): void;
    onMessage(handler: (data: string) => void): void;
    onClose(handler: (reason?: string) => void): void;
    close(): Promise<void>;
}
export interface CdpEnvelope {
    id: number;
    method: string;
    params?: Record<string, unknown>;
    sessionId?: string;
}
export interface CdpResponse {
    id: number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
    sessionId?: string;
}
export interface CdpEventMessage {
    method: string;
    params?: Record<string, unknown>;
    sessionId?: string;
}
export type CdpIncoming = CdpResponse | CdpEventMessage;
/** Serialize a command envelope for the wire. */
export declare function encodeCommand(env: CdpEnvelope): string;
/** Parse an incoming CDP frame. Returns null when the payload isn't valid JSON. */
export declare function decodeIncoming(data: string): CdpIncoming | null;
/** CDP protocol client. Composes a transport with call/response matching + event dispatch.
 *  Same behavioural contract as the OSS `WsCDPClient` but transport-agnostic. */
export declare class CdpProtocolClient {
    private transport;
    private nextId;
    private pending;
    private eventHandlers;
    private closed;
    constructor(transport: CdpTransport);
    /** Send a CDP command. Pass a `sessionId` to route to a specific attached target
     *  (flat-mode CDP); pass undefined for the browser-level session. Cloud consumers
     *  typically define their own `send()` sugar as `sendOn(m, p, undefined)`. */
    sendOn(method: string, params: Record<string, unknown> | undefined, sessionId: string | undefined): Promise<unknown>;
    on(event: string, handler: (params: Record<string, unknown>) => void): void;
    off(event: string, handler: (params: Record<string, unknown>) => void): void;
    close(): Promise<void>;
    private handleMessage;
    private handleClose;
    private rejectAllPending;
}
//# sourceMappingURL=protocol.d.ts.map