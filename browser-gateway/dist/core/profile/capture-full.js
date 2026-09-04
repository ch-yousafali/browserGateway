import { filterMarkerCookies } from "./marker.js";
import { WsCDPClient } from "./cdp-client.js";
import { navigateAndEvaluate, runHelperPool, withDeadline, withHelperPool, } from "./helper-pool.js";
const STORAGE_DUMP_EXPR = `
  (() => {
    const out = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k !== null) out[k] = localStorage.getItem(k) ?? "";
      }
    } catch (e) {
      return JSON.stringify({ __error: String(e && e.message || e) });
    }
    return JSON.stringify(out);
  })()
`;
/** Captures cookies and per-origin localStorage on an already-connected client. */
export async function captureFullStateOnClient(client, originsToCapture, opts = {}) {
    const started = Date.now();
    const helperCount = Math.max(1, opts.helperPages ?? 4);
    const perOriginTimeout = opts.perOriginTimeoutMs ?? 5_000;
    const signal = opts.signal;
    const cookieResp = (await client.send("Storage.getCookies"));
    const cookies = filterMarkerCookies(cookieResp?.cookies ?? []);
    let originSet = originsToCapture;
    if (opts.includeCookieDerivedOrigins) {
        const cookieOrigins = originsFromCookies(cookies);
        originSet = Array.from(new Set([...originsToCapture, ...cookieOrigins]));
    }
    if (originSet.length === 0) {
        return { cookies, storage: {}, skippedOrigins: [], durationMs: Date.now() - started };
    }
    const { storage, skipped } = await captureOrigins(client, originSet, {
        helperCount,
        perOriginTimeout,
        signal,
    });
    return { cookies, storage, skippedOrigins: skipped, durationMs: Date.now() - started };
}
/** Opens its own WS to the provider, captures, then closes the WS. */
export async function captureFullStateViaTransient(providerWsUrl, originsToCapture, opts = {}) {
    const totalTimeout = opts.totalTimeoutMs ?? 30_000;
    return withDeadline((async () => {
        const client = new WsCDPClient();
        try {
            await client.connect(providerWsUrl, totalTimeout);
            return await captureFullStateOnClient(client, originsToCapture, opts);
        }
        finally {
            await client.close().catch(() => undefined);
        }
    })(), totalTimeout, "captureFullStateViaTransient");
}
async function captureOrigins(client, origins, cfg) {
    const storage = {};
    const skipped = [];
    await withHelperPool(client, cfg.helperCount, origins.length, (helpers) => runHelperPool({
        helpers,
        origins,
        signal: cfg.signal,
        work: (origin, helper) => captureOneOrigin(client, helper, origin, cfg.perOriginTimeout),
        onSuccess: (origin, data) => { storage[origin] = data; },
        onError: (origin, reason) => skipped.push({ origin, reason }),
    }));
    return { storage, skipped };
}
async function captureOneOrigin(client, helper, origin, timeoutMs) {
    const value = await navigateAndEvaluate(client, helper, origin, STORAGE_DUMP_EXPR, timeoutMs);
    if (typeof value !== "string") {
        throw new Error("evaluate returned non-string");
    }
    let parsed;
    try {
        parsed = JSON.parse(value);
    }
    catch (err) {
        throw new Error(`invalid JSON from page: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
    }
    if ("__error" in parsed) {
        throw new Error(`storage read error: ${parsed.__error}`);
    }
    return {
        localStorage: parsed,
        sessionStorage: {},
        lastVisitedAt: new Date().toISOString(),
    };
}
/** Returns https origin candidates derived from a cookie list. */
export function originsFromCookies(cookies) {
    const set = new Set();
    for (const c of cookies) {
        const domain = c.domain.startsWith(".") ? c.domain.slice(1) : c.domain;
        if (!domain || /^\d+\.\d+\.\d+\.\d+$/.test(domain) || domain === "localhost")
            continue;
        set.add(`https://${domain}`);
    }
    return Array.from(set);
}
//# sourceMappingURL=capture-full.js.map