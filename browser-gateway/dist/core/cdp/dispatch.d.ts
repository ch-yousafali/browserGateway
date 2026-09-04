/** Pure CDP response dispatch — shared between `WsCDPClient` (Node ws) and
 *  `CdpProtocolClient` (isomorphic). Neither owns the transport nor the event
 *  layer; both delegate response matching to this helper. */
export interface PendingCall {
    resolve: (value: unknown) => void;
    reject: (reason: Error) => void;
    timer?: ReturnType<typeof setTimeout>;
}
/** Given a decoded CDP message and a pending-call map, dispatch a response and
 *  return true if this message was a response envelope. Callers should skip
 *  event dispatch when this returns true. */
export declare function dispatchCdpResponse(msg: {
    id?: unknown;
    error?: {
        message: string;
    };
    result?: unknown;
}, pending: Map<number, PendingCall>): boolean;
//# sourceMappingURL=dispatch.d.ts.map