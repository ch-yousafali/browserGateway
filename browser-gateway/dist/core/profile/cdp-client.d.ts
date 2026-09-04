import type { CDPClient } from "./cdp.js";
import { TypedCdpEventEmitter } from "./cdp-event-base.js";
/**
 * Minimal raw-CDP client over a single WebSocket.
 *
 * - Browser-level only: no Target.attachToTarget by default.
 * - Suitable for Storage.* commands (browser-wide cookies, etc.) without a target.
 * - Tests use the existing EventEmitter-based MockCDP; production uses this.
 */
export declare class WsCDPClient extends TypedCdpEventEmitter implements CDPClient {
    private ws;
    private nextId;
    private readonly pending;
    private closeError;
    private readonly commandTimeoutMs;
    constructor(opts?: {
        commandTimeoutMs?: number;
    });
    connect(wsUrl: string, timeoutMs?: number): Promise<void>;
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    /**
     * Send a CDP command tagged with a flat-mode sessionId. Identical to send()
     * when sessionId is undefined. Used by the eager-inject helper-page pool
     * to route commands to specific attached targets.
     */
    sendOn<T = unknown>(method: string, params: Record<string, unknown> | undefined, sessionId: string | undefined): Promise<T>;
    private relayMessage;
    private relayClose;
    /**
     * Forwards a raw client CDP message straight to the provider, unparsed. Used
     * by the gateway's single-connection profile relay so the client's session
     * rides the SAME socket that inject/capture use — no second browser.
     */
    rawSend(data: Buffer | string): void;
    /**
     * Relay mode: forward every provider message to `onMessage` and the socket
     * close to `onClose`, in addition to the normal command/event handling.
     * Provider replies to the client's own command ids have no pending call here,
     * so `handleMessage` ignores them — only the relay forwards them onward.
     */
    startRelay(onMessage: (data: Buffer) => void, onClose: () => void): void;
    stopRelay(): void;
    close(): Promise<void>;
    private rejectAllPending;
    private handleMessage;
    private handleClose;
}
//# sourceMappingURL=cdp-client.d.ts.map