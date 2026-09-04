import { withTimeout } from "./cdp-utils.js";
const SNAPSHOT_EXPR = `
  (() => {
    try {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k !== null) ls[k] = localStorage.getItem(k) ?? "";
      }
      return JSON.stringify({ origin: location.origin, localStorage: ls });
    } catch (e) {
      return JSON.stringify({ __error: String((e && e.message) || e) });
    }
  })()
`;
/** Snapshots the live top-frame origin + full localStorage via `Runtime.evaluate`
 *  on `sessionId`. If `contextId` is provided, the eval is pinned to that
 *  specific execution context — critical for capturing the OLD document
 *  during a top-frame navigation, before the new document takes over.
 *  Returns null on eval failure, race (context destroyed before eval ran),
 *  or non-http(s) origin. Never throws. */
export async function captureCurrentOriginSnapshot(client, sessionId, timeoutMs = 5_000, contextId) {
    let value;
    try {
        const params = {
            expression: SNAPSHOT_EXPR,
            returnByValue: true,
            awaitPromise: false,
        };
        if (contextId !== undefined)
            params.contextId = contextId;
        const resp = await withTimeout(client.sendOn("Runtime.evaluate", params, sessionId), timeoutMs, "capture-current-origin");
        if (resp?.exceptionDetails)
            return null;
        value = resp?.result?.value;
    }
    catch {
        return null;
    }
    if (typeof value !== "string")
        return null;
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch {
        return null;
    }
    if (parsed.__error || typeof parsed.origin !== "string")
        return null;
    if (!parsed.origin.startsWith("http"))
        return null;
    return {
        origin: parsed.origin,
        localStorage: parsed.localStorage ?? {},
    };
}
//# sourceMappingURL=capture-current-origin.js.map