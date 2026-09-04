/** Concrete implementation of the SessionState interface. The pipeline
 *  updates the mutable Map/state fields as CDP framework messages flow;
 *  plugins read via the SessionState interface which exposes ReadonlyMap. */
export class SessionStateImpl {
    upstreamUrl;
    targets = new Map();
    sendInternal;
    sendInternalOneWay;
    close;
    constructor(upstreamUrl) {
        this.upstreamUrl = upstreamUrl;
    }
    /** Update state based on a client → upstream command. Cheap state-machine
     *  updates only; returns quickly. */
    applyClientCommand(_msg) {
        // v0.1: no client-side state updates needed. Placeholder for future
        // features (e.g., tracking Page.enable per-session for a plugin that
        // needs to know if the client already enabled the domain).
    }
    /** Update state based on an upstream → client event. */
    applyUpstreamEvent(msg) {
        if (msg.method === "Target.attachedToTarget") {
            const p = msg.params;
            if (p?.sessionId && p.targetInfo?.targetId) {
                this.targets.set(p.sessionId, {
                    targetId: p.targetInfo.targetId,
                    type: normalizeType(p.targetInfo.type),
                    url: p.targetInfo.url,
                });
            }
        }
        else if (msg.method === "Target.detachedFromTarget") {
            const p = msg.params;
            if (p?.sessionId)
                this.targets.delete(p.sessionId);
        }
    }
}
function normalizeType(t) {
    if (t === "page" || t === "iframe" || t === "worker" || t === "browser")
        return t;
    return "other";
}
//# sourceMappingURL=session-state.js.map