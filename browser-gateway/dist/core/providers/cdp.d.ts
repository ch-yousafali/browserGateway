interface CdpVersionInfo {
    browser?: string;
    webSocketDebuggerUrl?: string;
    protocolVersion?: string;
}
/** Vendor fields a provider may advertise on its CDP discovery endpoint. */
export interface ProviderIdentity {
    /** Set when the provider is a browserserve instance. */
    browserserveVersion: string | null;
    /** The provider's self-reported safe concurrency ceiling, when advertised. */
    advertisedMaxConcurrent: number | null;
}
export declare const UNKNOWN_IDENTITY: Readonly<ProviderIdentity>;
/**
 * Derives the HTTP `/json/version` discovery URL for a provider URL of any
 * scheme. CDP servers serve discovery over HTTP on the same host/port as the
 * WebSocket endpoint; auth query params are preserved.
 */
export declare function httpDiscoveryUrl(providerUrl: string): string;
/**
 * Reads a provider's vendor identity from its `/json/version` response.
 * Best-effort: any failure (unreachable, non-JSON, missing fields) returns
 * {@link UNKNOWN_IDENTITY} rather than throwing.
 */
export declare function fetchProviderIdentity(providerUrl: string, timeoutMs?: number, headers?: Record<string, string>): Promise<ProviderIdentity>;
export declare function fetchCdpVersion(httpUrl: string, timeoutMs?: number, headers?: Record<string, string>): Promise<CdpVersionInfo>;
export declare function isHttpUrl(url: string): boolean;
export declare function resolveWsUrl(providerUrl: string, timeoutMs?: number, headers?: Record<string, string>): Promise<string>;
export {};
//# sourceMappingURL=cdp.d.ts.map