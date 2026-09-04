import type { HelperPoolCdpClient } from "../../core/profile/helper-pool-client.js";
import type { CdpMessage, SessionState } from "../types.js";
type Handler = (params: unknown) => void;
/** Bridges the pipeline's SessionState to the HelperPoolCdpClient interface
 *  that profile inject/capture and helper-pool code expect. Commands go out
 *  via `state.sendInternal` (rides the client's own CDP connection — no
 *  second WS). Events are forwarded from the plugin's `onEvent` hook via
 *  {@link dispatchEvent}. */
export declare class PluginCdpClient implements HelperPoolCdpClient {
    private readonly state;
    private readonly handlers;
    constructor(state: SessionState);
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    sendOn<T = unknown>(method: string, params?: Record<string, unknown>, sessionId?: string): Promise<T>;
    on(method: string, handler: Handler): void;
    off(method: string, handler: Handler): void;
    /** Route a CDP event received via the pipeline plugin's `onEvent` hook
     *  to any registered handlers. The `__sessionId` magic key preserved from
     *  `WsCDPClient` behavior lets helper-pool code filter by target. */
    dispatchEvent(msg: CdpMessage): void;
    /** Registered method names (test hook). */
    registeredMethods(): string[];
}
export {};
//# sourceMappingURL=profile-cdp-client.d.ts.map