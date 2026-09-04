import type { MiddlewareHandler } from "hono";
/**
 * Production security headers — HSTS, nosniff, frame-ancestors, Referrer-Policy.
 * Applied to every HTTP response except infrastructure-probe paths.
 *
 * HSTS is only emitted when the request itself was over HTTPS — emitting
 * over plain HTTP is a no-op per the spec and risks a misconfigured client
 * locking onto an HTTP-only loopback.
 */
export declare function securityHeaders(): MiddlewareHandler;
//# sourceMappingURL=security-headers.d.ts.map