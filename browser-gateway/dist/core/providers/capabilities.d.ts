export type CapabilityState = "supported" | "unsupported" | "unknown";
export interface ProviderCapabilities {
    browserCookies: CapabilityState;
    targetCreate: CapabilityState;
    targetGetTargets: CapabilityState;
    fetchInterception: CapabilityState;
    pageScreencast: CapabilityState;
    targetCreateLatencyMs: number | null;
    /** Detected vendor: a browserserve instance, or a generic CDP provider. */
    providerKind: "browserserve" | "generic";
    /** The provider's self-reported concurrency ceiling, when it advertises one. */
    advertisedMaxConcurrent: number | null;
    probedAt: string;
    probeDurationMs: number;
    errors: string[];
}
export declare const UNKNOWN_CAPABILITIES: Readonly<Omit<ProviderCapabilities, "probedAt">>;
export interface ProbeOptions {
    perStepTimeoutMs?: number;
    totalTimeoutMs?: number;
}
/**
 * Probes a provider's CDP endpoint for features the gateway uses. Best-effort:
 * any individual probe failure is captured in `errors` rather than thrown.
 */
export declare function probeProviderCapabilities(providerUrl: string, opts?: ProbeOptions): Promise<ProviderCapabilities>;
//# sourceMappingURL=capabilities.d.ts.map