import type { IncomingMessage } from "node:http";
/**
 * Return the effective protocol the client used to reach us, honoring
 * `X-Forwarded-Proto` set by a trusted reverse proxy. Falls back to the
 * request URL scheme.
 */
export declare function getEffectiveProtocol(c: {
    req: {
        header: (name: string) => string | undefined;
        url: string;
    };
}): "http" | "https";
/** Same as `getEffectiveProtocol` but operates on a raw Node `IncomingMessage`. */
export declare function getEffectiveProtocolNode(req: IncomingMessage): "http" | "https";
/**
 * Return the effective host the client used to reach us, honoring
 * `X-Forwarded-Host` set by trusted reverse proxies. Falls back to the
 * `Host` header.
 */
export declare function getEffectiveHost(c: {
    req: {
        header: (name: string) => string | undefined;
    };
}): string;
/**
 * Parse `BG_ALLOWED_ORIGINS` (comma-separated). Empty / unset returns
 * an empty set, which the gateway treats as "same-origin only".
 */
export declare function parseAllowedOrigins(value: string | undefined): Set<string>;
//# sourceMappingURL=request.d.ts.map