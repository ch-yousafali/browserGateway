/**
 * Environment-agnostic relay contract.
 *
 * Every browser-gateway deployment ultimately does the same thing at the
 * transport layer: accept a client WebSocket upgrade, open an upstream
 * WebSocket to a provider, and pipe bytes between them until either side
 * closes. Node.js does that with raw TCP + Duplex piping; Cloudflare
 * Workers does it with WebSocketPair + `fetch(url, {headers:{Upgrade}})`;
 * a Bun or Deno host would do it differently again.
 *
 * `RelayTransport` is the plug-in point. The routing brain in `core/`
 * remains environment-agnostic; each host implements the transport once
 * and shares everything above it (selection, cooldown, concurrency,
 * session tracking, profile eligibility).
 */
/**
 * Compose the upstream headers a bridge must send from provider-config `headers`
 * and any URL userinfo. Isomorphic (Node + Workers). Rules:
 *   - URL userinfo → `Authorization: Basic <base64(user:pass)>`, but only if no
 *     `Authorization` header already exists in `providerHeaders`.
 *   - URL userinfo is stripped from the returned `upstreamUrl` (RFC 3986 forbids
 *     it on the wire).
 *   - Header key casing from `providerHeaders` is preserved verbatim.
 *
 * @throws Error if `providerUrl` is not a valid URL.
 */
export function resolveProviderOutbound(providerUrl, providerHeaders) {
    const u = new URL(providerUrl);
    const headers = { ...(providerHeaders ?? {}) };
    const hasAuthorization = Object.keys(headers).some((k) => k.toLowerCase() === "authorization");
    if (u.username && !hasAuthorization) {
        const user = decodeURIComponent(u.username);
        const pass = decodeURIComponent(u.password ?? "");
        headers["Authorization"] = `Basic ${globalThis.btoa(`${user}:${pass}`)}`;
    }
    if (u.username || u.password) {
        u.username = "";
        u.password = "";
    }
    return { upstreamUrl: u.toString(), upstreamHeaders: headers };
}
//# sourceMappingURL=transport.js.map