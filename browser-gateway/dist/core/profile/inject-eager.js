import { WsCDPClient } from "./cdp-client.js";
import { sanitizeCookiesForInject } from "./cookie-helpers.js";
import { navigateAndEvaluate, runHelperPool, withDeadline, withHelperPool, } from "./helper-pool.js";
/** Eagerly injects cookies and the top-K origins' localStorage on an already-connected client. */
export async function injectStateEager(client, profile, opts = {}) {
    const started = Date.now();
    const helperCount = Math.max(1, opts.helperPages ?? 4);
    const limit = Math.max(0, opts.eagerOriginLimit ?? 20);
    const perOriginTimeout = opts.perOriginTimeoutMs ?? 5_000;
    const signal = opts.signal;
    const cookiesSet = await injectCookies(client, profile.cookies);
    const ranked = rankOrigins(profile.storage);
    const eagerOrigins = ranked.slice(0, limit);
    const deferred = ranked.slice(limit);
    if (eagerOrigins.length === 0) {
        return {
            cookiesSet,
            originsInjected: [],
            originsDeferred: deferred,
            skippedOrigins: [],
            durationMs: Date.now() - started,
        };
    }
    const { injected, skipped } = await injectEagerOrigins(client, eagerOrigins, profile.storage, { helperCount, perOriginTimeout, signal });
    return {
        cookiesSet,
        originsInjected: injected,
        originsDeferred: deferred,
        skippedOrigins: skipped,
        durationMs: Date.now() - started,
    };
}
/** Opens a fresh WS to the provider, runs the eager inject, then closes the WS. */
export async function injectStateEagerViaTransient(providerWsUrl, profile, opts = {}) {
    const totalTimeout = opts.totalTimeoutMs ?? 10_000;
    return withDeadline((async () => {
        const client = new WsCDPClient();
        try {
            await client.connect(providerWsUrl, totalTimeout);
            return await injectStateEager(client, profile, opts);
        }
        finally {
            await client.close().catch(() => undefined);
        }
    })(), totalTimeout, "injectStateEagerViaTransient");
}
async function injectCookies(client, cookies) {
    await client.send("Storage.clearCookies", {}).catch(() => undefined);
    if (cookies.length === 0)
        return 0;
    await client.send("Storage.setCookies", { cookies: sanitizeCookiesForInject(cookies) });
    return cookies.length;
}
async function injectEagerOrigins(client, origins, storage, cfg) {
    const injected = [];
    const skipped = [];
    await withHelperPool(client, cfg.helperCount, origins.length, (helpers) => {
        const targetOrigins = origins.filter((o) => hasLocal(storage[o]));
        return runHelperPool({
            helpers,
            origins: targetOrigins,
            signal: cfg.signal,
            work: (origin, helper) => navigateAndEvaluate(client, helper, origin, buildLocalStorageWriteExpression(storage[origin]), cfg.perOriginTimeout),
            onSuccess: (origin) => injected.push(origin),
            onError: (origin, reason) => skipped.push({ origin, reason }),
        });
    });
    return { injected, skipped };
}
/** Returns a JS expression that writes the origin's localStorage entries. */
export function buildLocalStorageWriteExpression(data) {
    const local = JSON.stringify(data.localStorage ?? {});
    return `
    (() => {
      const result = { wrote: 0, errors: [] };
      try { localStorage.clear(); } catch (e) { result.errors.push("localStorage.clear failed: " + String(e && e.message || e)); }
      try { sessionStorage.clear(); } catch (e) { result.errors.push("sessionStorage.clear failed: " + String(e && e.message || e)); }
      try {
        const entries = ${local};
        for (const [k, v] of Object.entries(entries)) {
          try { localStorage.setItem(k, v); result.wrote++; }
          catch (e) { result.errors.push(k + ": " + String(e && e.message || e)); }
        }
      } catch (e) { result.errors.push("localStorage failed: " + String(e && e.message || e)); }
      return result;
    })()
  `;
}
/** Returns origins sorted by lastVisitedAt descending. */
export function rankOrigins(storage) {
    return Object.entries(storage)
        .map(([origin, data]) => ({
        origin,
        ts: data.lastVisitedAt ? Date.parse(data.lastVisitedAt) : 0,
    }))
        .sort((a, b) => b.ts - a.ts)
        .map((x) => x.origin);
}
function hasLocal(data) {
    if (!data)
        return false;
    return Object.keys(data.localStorage ?? {}).length > 0;
}
//# sourceMappingURL=inject-eager.js.map