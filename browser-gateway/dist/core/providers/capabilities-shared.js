/** Shared helpers for the capability probe. Both {@link probeProviderCapabilities}
 *  (Node convenience, `./capabilities.ts`) and {@link probeCapabilitiesWithClient}
 *  (isomorphic, `./capabilities-with-client.ts`) call `runCapabilityProbeSteps`
 *  to run the CDP step sequence against a connected client. */
import { fetchProviderIdentity } from "./cdp.js";
import { UNKNOWN_CAPABILITIES } from "./capabilities.js";
/** Read the provider's `/json/version` identity headers, stamp the capabilities
 *  object with the vendor + advertised concurrency, and hand back the timing
 *  budget both `probeProviderCapabilities` and `probeCapabilitiesWithClient`
 *  feed into {@link runCapabilityProbeSteps}. */
export async function initCapsFromIdentity(providerUrl, opts = {}) {
    const started = Date.now();
    const perStep = opts.perStepTimeoutMs ?? 8_000;
    const total = opts.totalTimeoutMs ?? 30_000;
    const caps = {
        ...UNKNOWN_CAPABILITIES,
        probedAt: new Date().toISOString(),
        errors: [],
    };
    const deadline = started + total;
    const identity = await fetchProviderIdentity(providerUrl, perStep);
    caps.providerKind = identity.browserserveVersion === null ? "generic" : "browserserve";
    caps.advertisedMaxConcurrent = identity.advertisedMaxConcurrent;
    return { caps, perStep, deadline, started };
}
/** Runs the CDP step sequence (browserCookies → targetCreate → targetGetTargets →
 *  attach → fetchInterception → pageScreencast) against a connected client. The
 *  caller owns identity stamping and transport lifecycle. Best-effort — never throws. */
export async function runCapabilityProbeSteps(client, caps, opts) {
    const { perStepTimeoutMs: perStep, deadlineMs: deadline, startedMs: started } = opts;
    await runStep(caps, "browserCookies", async () => {
        const r = (await raceStep(client.sendOn("Storage.getCookies", {}, undefined), perStep, "Storage.getCookies", caps));
        return r !== null && Array.isArray(r.cookies);
    });
    if (Date.now() > deadline)
        return finish(caps, started);
    let targetId = null;
    const createStart = Date.now();
    await runStep(caps, "targetCreate", async () => {
        const r = (await raceStep(client.sendOn("Target.createTarget", { url: "about:blank" }, undefined), perStep, "Target.createTarget", caps));
        targetId = r?.targetId ?? null;
        caps.targetCreateLatencyMs = Date.now() - createStart;
        return targetId !== null;
    });
    if (Date.now() > deadline) {
        await closeTargetIfOpen(client, targetId);
        return finish(caps, started);
    }
    await runStep(caps, "targetGetTargets", async () => {
        const r = (await raceStep(client.sendOn("Target.getTargets", {}, undefined), perStep, "Target.getTargets", caps));
        return r !== null && Array.isArray(r.targetInfos);
    });
    let sessionId = null;
    if (targetId) {
        await runStep(caps, "_attach", async () => {
            const r = (await raceStep(client.sendOn("Target.attachToTarget", { targetId, flatten: true }, undefined), perStep, "Target.attachToTarget", caps));
            sessionId = r?.sessionId ?? null;
            return sessionId !== null;
        });
    }
    if (sessionId) {
        await runStep(caps, "fetchInterception", async () => {
            await raceStep(client.sendOn("Fetch.enable", { patterns: [{ urlPattern: "*" }] }, sessionId), perStep, "Fetch.enable", caps);
            await raceStep(client.sendOn("Fetch.disable", {}, sessionId), perStep, "Fetch.disable", caps);
            return true;
        });
        await runStep(caps, "pageScreencast", async () => {
            await raceStep(client.sendOn("Page.enable", {}, sessionId), perStep, "Page.enable", caps);
            await raceStep(client.sendOn("Page.startScreencast", { format: "jpeg", quality: 50 }, sessionId), perStep, "Page.startScreencast", caps);
            await raceStep(client.sendOn("Page.stopScreencast", {}, sessionId), perStep, "Page.stopScreencast", caps);
            return true;
        });
    }
    await closeTargetIfOpen(client, targetId);
    return finish(caps, started);
}
async function closeTargetIfOpen(client, targetId) {
    if (!targetId)
        return;
    try {
        await client.sendOn("Target.closeTarget", { targetId }, undefined);
    }
    catch {
        // best-effort
    }
}
async function runStep(caps, capKey, fn) {
    const errCountBefore = caps.errors.length;
    let ok = false;
    try {
        ok = await fn();
    }
    catch (err) {
        caps.errors.push(`${String(capKey)}: ${errorMessage(err)}`);
    }
    if (capKey === "_attach")
        return;
    const cap = capKey;
    caps[cap] = ok && caps.errors.length === errCountBefore ? "supported" : "unsupported";
}
function raceStep(op, timeoutMs, label, caps) {
    return Promise.race([
        op,
        new Promise((resolve) => setTimeout(() => {
            caps.errors.push(`${label}: timeout after ${timeoutMs}ms`);
            resolve(null);
        }, timeoutMs)),
    ]);
}
function finish(caps, started) {
    caps.probeDurationMs = Date.now() - started;
    return caps;
}
export function errorMessage(err) {
    if (err instanceof Error)
        return err.message;
    return String(err);
}
//# sourceMappingURL=capabilities-shared.js.map