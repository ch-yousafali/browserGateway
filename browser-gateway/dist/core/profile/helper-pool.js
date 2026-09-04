const FETCH_FULFILL_BODY_B64 = Buffer.from("<html></html>").toString("base64");
/** Opens a helper target with Fetch and Page domains enabled. */
export async function openHelperPage(client) {
    const created = (await client.send("Target.createTarget", { url: "about:blank" }));
    const attached = (await client.send("Target.attachToTarget", {
        targetId: created.targetId,
        flatten: true,
    }));
    await client.sendOn("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, attached.sessionId);
    await client.sendOn("Page.enable", {}, attached.sessionId);
    return { targetId: created.targetId, sessionId: attached.sessionId };
}
/** Installs a Fetch.requestPaused fulfiller scoped to the given sessions. Returns an unregister fn. */
export function installFetchFulfill(client, helperSessionIds) {
    const onPaused = (params) => {
        const p = params;
        if (!p.requestId || !p.__sessionId)
            return;
        if (!helperSessionIds.has(p.__sessionId))
            return;
        void client
            .sendOn("Fetch.fulfillRequest", {
            requestId: p.requestId,
            responseCode: 200,
            responseHeaders: [{ name: "content-type", value: "text/html" }],
            body: FETCH_FULFILL_BODY_B64,
        }, p.__sessionId)
            .catch(() => undefined);
    };
    client.on("Fetch.requestPaused", onPaused);
    return () => {
        try {
            client.off("Fetch.requestPaused", onPaused);
        }
        catch {
            // ignore
        }
    };
}
/** Closes helper targets and disables Fetch on each session. */
export async function closeHelperPages(client, helpers) {
    await Promise.allSettled(helpers.map(async (h) => {
        await client.sendOn("Fetch.disable", {}, h.sessionId).catch(() => undefined);
        await client.send("Target.closeTarget", { targetId: h.targetId }).catch(() => undefined);
    }));
}
/** Opens up to `count` helper pages sequentially. Returns however many succeeded. */
export async function openHelperPool(client, count) {
    const helpers = [];
    for (let i = 0; i < count; i++) {
        try {
            helpers.push(await openHelperPage(client));
        }
        catch (err) {
            if (helpers.length === 0)
                throw err;
            break;
        }
    }
    return helpers;
}
/**
 * Wraps the helper-pool lifecycle used by profile capture/inject: install
 * Fetch fulfill, open up to `min(helperCount, originCount)` helper pages,
 * hand them to `work`, guarantee teardown in `finally`.
 */
export async function withHelperPool(client, helperCount, originCount, work) {
    const helperSessionIds = new Set();
    const detachFulfill = installFetchFulfill(client, helperSessionIds);
    const helpers = await openHelperPool(client, Math.min(helperCount, originCount));
    for (const h of helpers)
        helperSessionIds.add(h.sessionId);
    try {
        return await work(helpers);
    }
    finally {
        detachFulfill();
        await closeHelperPages(client, helpers);
    }
}
/** Races a Promise against a per-operation timeout. */
export function raceTimeout(p, timeoutMs, label) {
    return Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout (${timeoutMs}ms): ${label}`)), timeoutMs)),
    ]);
}
/** Wall-clock deadline around a whole operation. Rejects on timeout. */
export function withDeadline(op, timeoutMs, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} timeout after ${timeoutMs}ms`)), timeoutMs);
        op.then((v) => { clearTimeout(timer); resolve(v); }, (e) => { clearTimeout(timer); reject(e); });
    });
}
/** Navigates the helper to an origin and evaluates `expression` in its page context. */
export async function navigateAndEvaluate(client, helper, origin, expression, timeoutMs) {
    await raceTimeout(client.sendOn("Page.navigate", { url: origin + "/" }, helper.sessionId), timeoutMs, `navigate ${origin}`);
    const resp = (await raceTimeout(client.sendOn("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: false }, helper.sessionId), timeoutMs, `evaluate ${origin}`));
    if (resp?.exceptionDetails) {
        throw new Error("runtime exception: " +
            (resp.exceptionDetails.exception?.description ??
                resp.exceptionDetails.text ??
                "unknown exception"));
    }
    return resp?.result?.value;
}
/** Round-robin work over `origins` across `helpers`. Per-origin errors go to `onError`. */
export async function runHelperPool(opts) {
    let cursor = 0;
    await Promise.allSettled(opts.helpers.map(async (helper) => {
        while (true) {
            if (opts.signal?.aborted)
                return;
            const idx = cursor++;
            if (idx >= opts.origins.length)
                return;
            const origin = opts.origins[idx];
            try {
                const v = await opts.work(origin, helper);
                opts.onSuccess(origin, v);
            }
            catch (err) {
                opts.onError(origin, err instanceof Error ? err.message : String(err));
            }
        }
    }));
}
//# sourceMappingURL=helper-pool.js.map