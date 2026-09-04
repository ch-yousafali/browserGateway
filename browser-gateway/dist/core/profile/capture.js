import { evaluateExpression, navigateAndWait, resolveProfileOptions } from "./cdp-utils.js";
import { PROFILE_VERSION, } from "./types.js";
const STORAGE_DUMP_EXPR = `
  (() => {
    const dump = (s) => {
      const out = {};
      try {
        for (let i = 0; i < s.length; i++) {
          const k = s.key(i);
          if (k !== null) out[k] = s.getItem(k) ?? "";
        }
      } catch (e) {
        return { __error: String(e && e.message || e) };
      }
      return out;
    };
    return JSON.stringify({
      localStorage: dump(localStorage),
      sessionStorage: dump(sessionStorage),
    });
  })()
`;
const USER_AGENT_EXPR = "navigator.userAgent";
/**
 * Capture browser state from a CDP session for cross-session replay.
 *
 * Captures: cookies (all), localStorage (per-origin), sessionStorage (per-origin), userAgent.
 * Skips: HTTP cache, code cache, service workers, IndexedDB (v2), in-memory state.
 *
 * Per-origin storage capture is best-effort. If one origin fails (network error,
 * runtime exception, navigation timeout) it's added to `meta.skippedOrigins`
 * and the rest of the capture proceeds.
 */
export async function captureState(cdp, opts = {}) {
    const { started, navTimeout, evalTimeout, signal } = resolveProfileOptions(opts, "capture");
    const cookieResp = (await cdp.send("Network.getAllCookies"));
    const cookies = cookieResp?.cookies ?? [];
    const origins = uniqueOrigins(opts.origins ?? []);
    const storage = {};
    const capturedOrigins = [];
    const skippedOrigins = [];
    for (const origin of origins) {
        if (signal?.aborted)
            throw new Error("capture aborted");
        try {
            await navigateAndWait(cdp, origin, navTimeout);
            const dump = await evaluateExpression(cdp, STORAGE_DUMP_EXPR, evalTimeout);
            if (typeof dump !== "string") {
                skippedOrigins.push({ origin, reason: "evaluate returned non-string" });
                continue;
            }
            const parsed = JSON.parse(dump);
            if (isErrorBag(parsed.localStorage) || isErrorBag(parsed.sessionStorage)) {
                skippedOrigins.push({ origin, reason: "storage read error in page context" });
                continue;
            }
            storage[origin] = {
                localStorage: parsed.localStorage,
                sessionStorage: parsed.sessionStorage,
                lastVisitedAt: new Date().toISOString(),
            };
            capturedOrigins.push(origin);
        }
        catch (err) {
            skippedOrigins.push({ origin, reason: errorMessage(err) });
        }
    }
    let userAgent;
    try {
        const ua = await evaluateExpression(cdp, USER_AGENT_EXPR, evalTimeout);
        if (typeof ua === "string")
            userAgent = ua;
    }
    catch {
        // best-effort
    }
    return {
        version: PROFILE_VERSION,
        capturedAt: new Date().toISOString(),
        cookies,
        storage,
        meta: {
            userAgent,
            capturedOrigins,
            skippedOrigins,
            durationMs: Date.now() - started,
        },
    };
}
function uniqueOrigins(list) {
    const seen = new Set();
    const out = [];
    for (const raw of list) {
        const normalized = normalizeOrigin(raw);
        if (!normalized)
            continue;
        if (seen.has(normalized))
            continue;
        seen.add(normalized);
        out.push(normalized);
    }
    return out;
}
function normalizeOrigin(raw) {
    try {
        const u = new URL(raw);
        if (u.protocol !== "http:" && u.protocol !== "https:")
            return null;
        return u.origin;
    }
    catch {
        return null;
    }
}
function isErrorBag(v) {
    return typeof v === "object" && v !== null && "__error" in v;
}
function errorMessage(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
//# sourceMappingURL=capture.js.map