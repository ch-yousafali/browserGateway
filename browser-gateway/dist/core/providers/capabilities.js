import { WsCDPClient } from "../profile/cdp-client.js";
import { resolveWsUrl } from "./cdp.js";
import { errorMessage, initCapsFromIdentity, runCapabilityProbeSteps } from "./capabilities-shared.js";
export const UNKNOWN_CAPABILITIES = Object.freeze({
    browserCookies: "unknown",
    targetCreate: "unknown",
    targetGetTargets: "unknown",
    fetchInterception: "unknown",
    pageScreencast: "unknown",
    targetCreateLatencyMs: null,
    providerKind: "generic",
    advertisedMaxConcurrent: null,
    probeDurationMs: 0,
    errors: [],
});
/**
 * Probes a provider's CDP endpoint for features the gateway uses. Best-effort:
 * any individual probe failure is captured in `errors` rather than thrown.
 */
export async function probeProviderCapabilities(providerUrl, opts = {}) {
    const { caps, perStep, deadline, started } = await initCapsFromIdentity(providerUrl, opts);
    let wsUrl;
    try {
        wsUrl = await resolveWsUrl(providerUrl);
    }
    catch (err) {
        caps.errors.push(`resolveWsUrl: ${errorMessage(err)}`);
        caps.probeDurationMs = Date.now() - started;
        return caps;
    }
    const client = new WsCDPClient();
    try {
        await client.connect(wsUrl, perStep);
    }
    catch (err) {
        caps.errors.push(`connect: ${errorMessage(err)}`);
        await client.close().catch(() => undefined);
        caps.probeDurationMs = Date.now() - started;
        return caps;
    }
    try {
        return await runCapabilityProbeSteps(client, caps, {
            perStepTimeoutMs: perStep,
            deadlineMs: deadline,
            startedMs: started,
        });
    }
    finally {
        await client.close().catch(() => undefined);
    }
}
//# sourceMappingURL=capabilities.js.map