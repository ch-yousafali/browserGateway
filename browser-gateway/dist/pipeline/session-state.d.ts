import type { CdpMessage, SessionState, TargetInfo } from "./types.js";
/** Concrete implementation of the SessionState interface. The pipeline
 *  updates the mutable Map/state fields as CDP framework messages flow;
 *  plugins read via the SessionState interface which exposes ReadonlyMap. */
export declare class SessionStateImpl implements SessionState {
    readonly upstreamUrl: string;
    readonly targets: Map<string, TargetInfo>;
    sendInternal: <T = unknown>(method: string, params?: Record<string, unknown>, sessionId?: string) => Promise<T>;
    sendInternalOneWay: (method: string, params?: Record<string, unknown>, sessionId?: string) => void;
    close: (reason: string) => void;
    constructor(upstreamUrl: string);
    /** Update state based on a client → upstream command. Cheap state-machine
     *  updates only; returns quickly. */
    applyClientCommand(_msg: CdpMessage): void;
    /** Update state based on an upstream → client event. */
    applyUpstreamEvent(msg: CdpMessage): void;
}
//# sourceMappingURL=session-state.d.ts.map