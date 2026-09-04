/** Shared helpers for the capability probe. Both {@link probeProviderCapabilities}
 *  (Node convenience, `./capabilities.ts`) and {@link probeCapabilitiesWithClient}
 *  (isomorphic, `./capabilities-with-client.ts`) call `runCapabilityProbeSteps`
 *  to run the CDP step sequence against a connected client. */
import { type ProbeOptions, type ProviderCapabilities } from "./capabilities.js";
export interface ProbeInit {
    caps: ProviderCapabilities;
    perStep: number;
    deadline: number;
    started: number;
}
/** Read the provider's `/json/version` identity headers, stamp the capabilities
 *  object with the vendor + advertised concurrency, and hand back the timing
 *  budget both `probeProviderCapabilities` and `probeCapabilitiesWithClient`
 *  feed into {@link runCapabilityProbeSteps}. */
export declare function initCapsFromIdentity(providerUrl: string, opts?: ProbeOptions): Promise<ProbeInit>;
/** Minimum shape the probe needs from a connected client. Both {@link WsCDPClient}
 *  and any Workers-native protocol client satisfy this. `sendOn` with undefined
 *  sessionId is the browser-level call — cloud consumers of `CdpProtocolClient`
 *  don't need to also expose a `send()` alias. */
export interface CapabilityProbeClient {
    sendOn(method: string, params: Record<string, unknown> | undefined, sessionId: string | undefined): Promise<unknown>;
}
export interface RunProbeStepsOptions {
    perStepTimeoutMs: number;
    deadlineMs: number;
    startedMs: number;
}
/** Runs the CDP step sequence (browserCookies → targetCreate → targetGetTargets →
 *  attach → fetchInterception → pageScreencast) against a connected client. The
 *  caller owns identity stamping and transport lifecycle. Best-effort — never throws. */
export declare function runCapabilityProbeSteps(client: CapabilityProbeClient, caps: ProviderCapabilities, opts: RunProbeStepsOptions): Promise<ProviderCapabilities>;
export declare function errorMessage(err: unknown): string;
//# sourceMappingURL=capabilities-shared.d.ts.map