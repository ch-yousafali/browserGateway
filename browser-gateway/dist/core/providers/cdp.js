export const UNKNOWN_IDENTITY = Object.freeze({
    browserserveVersion: null,
    advertisedMaxConcurrent: null,
});
/**
 * Derives the HTTP `/json/version` discovery URL for a provider URL of any
 * scheme. CDP servers serve discovery over HTTP on the same host/port as the
 * WebSocket endpoint; auth query params are preserved.
 */
export function httpDiscoveryUrl(providerUrl) {
    const parsed = new URL(providerUrl);
    const scheme = parsed.protocol === "wss:" || parsed.protocol === "https:" ? "https:" : "http:";
    return `${scheme}//${parsed.host}/json/version${parsed.search}`;
}
/**
 * Reads a provider's vendor identity from its `/json/version` response.
 * Best-effort: any failure (unreachable, non-JSON, missing fields) returns
 * {@link UNKNOWN_IDENTITY} rather than throwing.
 */
export async function fetchProviderIdentity(providerUrl, timeoutMs = 3000, headers) {
    try {
        const res = await fetch(httpDiscoveryUrl(providerUrl), {
            signal: AbortSignal.timeout(timeoutMs),
            ...(headers ? { headers } : {}),
        });
        if (!res.ok)
            return UNKNOWN_IDENTITY;
        const data = (await res.json());
        const version = data["Browserserve-Version"];
        const advertised = data["Browserserve-MaxConcurrent"];
        return {
            browserserveVersion: typeof version === "string" && version.length > 0 ? version : null,
            advertisedMaxConcurrent: typeof advertised === "number" && Number.isInteger(advertised) && advertised > 0
                ? advertised
                : null,
        };
    }
    catch {
        return UNKNOWN_IDENTITY;
    }
}
export async function fetchCdpVersion(httpUrl, timeoutMs = 3000, headers) {
    const versionUrl = `${httpUrl.replace(/\/$/, "")}/json/version`;
    const res = await fetch(versionUrl, {
        signal: AbortSignal.timeout(timeoutMs),
        ...(headers ? { headers } : {}),
    });
    if (!res.ok)
        throw new Error(`HTTP ${res.status}`);
    return (await res.json());
}
export function isHttpUrl(url) {
    return url.startsWith("http://") || url.startsWith("https://");
}
export async function resolveWsUrl(providerUrl, timeoutMs = 3000, headers) {
    if (!isHttpUrl(providerUrl))
        return providerUrl;
    const parsed = new URL(providerUrl);
    const data = await fetchCdpVersion(providerUrl, timeoutMs, headers);
    if (data.webSocketDebuggerUrl) {
        const wsUrl = new URL(data.webSocketDebuggerUrl);
        wsUrl.hostname = parsed.hostname;
        wsUrl.port = parsed.port;
        return wsUrl.toString();
    }
    return providerUrl;
}
//# sourceMappingURL=cdp.js.map