import { WsCDPClient } from "./cdp-client.js";
import { closeHelperPages, installFetchFulfill, navigateAndEvaluate, openHelperPool, runHelperPool, } from "./helper-pool.js";
import { buildLocalStorageWriteExpression } from "./inject-eager.js";
/** Runs the background phase on an already-connected client. Caller owns the WS lifecycle. */
export async function runBackgroundInjectOnClient(client, opts) {
    const started = Date.now();
    const helperCount = Math.max(1, opts.helperPages ?? 2);
    const perOriginTimeout = opts.perOriginTimeoutMs ?? 5_000;
    const injected = [];
    const skipped = [];
    const queue = opts.origins.filter((origin) => {
        if (opts.alreadyInjected.has(origin))
            return false;
        const data = opts.storage[origin];
        return data && Object.keys(data.localStorage ?? {}).length > 0;
    });
    if (queue.length === 0) {
        return { injected, skipped, durationMs: Date.now() - started };
    }
    let detachFulfill = null;
    const helperSessionIds = new Set();
    let helpers = [];
    try {
        detachFulfill = installFetchFulfill(client, helperSessionIds);
        helpers = await openHelperPool(client, Math.min(helperCount, queue.length));
        for (const h of helpers)
            helperSessionIds.add(h.sessionId);
        const targetOrigins = queue.filter((o) => {
            if (opts.alreadyInjected.has(o))
                return false;
            opts.alreadyInjected.add(o);
            return true;
        });
        await runHelperPool({
            helpers,
            origins: targetOrigins,
            signal: opts.signal,
            work: (origin, helper) => navigateAndEvaluate(client, helper, origin, buildLocalStorageWriteExpression(opts.storage[origin]), perOriginTimeout),
            onSuccess: (origin) => {
                injected.push(origin);
                opts.onInjected?.(origin);
            },
            onError: (origin, reason) => {
                skipped.push({ origin, reason });
                opts.onError?.(origin, reason);
            },
        });
    }
    finally {
        if (detachFulfill)
            detachFulfill();
        await closeHelperPages(client, helpers);
    }
    return { injected, skipped, durationMs: Date.now() - started };
}
/** Opens its own WS to the provider, runs the background phase, then closes the WS. */
export async function runBackgroundInject(opts) {
    const started = Date.now();
    const totalTimeout = opts.totalTimeoutMs ?? 60_000;
    if (opts.startDelayMs && opts.startDelayMs > 0) {
        await new Promise((resolve) => {
            const timer = setTimeout(() => {
                opts.signal?.removeEventListener("abort", onAbort);
                resolve();
            }, opts.startDelayMs);
            const onAbort = () => {
                clearTimeout(timer);
                resolve();
            };
            opts.signal?.addEventListener("abort", onAbort, { once: true });
        });
        if (opts.signal?.aborted) {
            return { injected: [], skipped: [], durationMs: Date.now() - started };
        }
    }
    const client = new WsCDPClient();
    try {
        await client.connect(opts.providerWsUrl, totalTimeout);
        return await runBackgroundInjectOnClient(client, opts);
    }
    finally {
        await client.close().catch(() => undefined);
    }
}
//# sourceMappingURL=inject-background.js.map