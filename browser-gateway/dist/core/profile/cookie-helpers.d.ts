import type { CdpCookie } from "./cdp.js";
/**
 * Capture all browser-level cookies via a transient CDP WebSocket.
 *
 * timeoutMs covers the entire operation (connect + send + close). If the peer
 * never responds, the deadline fires, the client is closed (rejecting any
 * pending send via the H2 fix), and the lifecycle's lock is released.
 *
 * On providers that count each WebSocket as a billable concurrent session,
 * this counts as one brief connection. On persistent-session providers and
 * raw Chrome, this is essentially free.
 */
export declare function captureCookiesViaTransient(wsUrl: string, timeoutMs?: number): Promise<CdpCookie[]>;
/**
 * Inject cookies via a transient CDP WebSocket using Storage.setCookies.
 *
 * No-op if cookies is empty. timeoutMs covers the entire operation.
 */
export declare function injectCookiesViaTransient(wsUrl: string, cookies: CdpCookie[], timeoutMs?: number): Promise<void>;
/**
 * Whether a captured cookie can be faithfully and safely re-injected.
 *
 * Returns false only for cookies Chrome would itself reject or evict, or that
 * cannot be reproduced without weakening their scope. Never mutates a cookie to
 * make it "fit" — a security attribute is preserved or the cookie is dropped.
 * Rejects: `SameSite=None` without `secure` (Chrome excludes it); a persistent
 * cookie already past `expires`; an opaque partition key (not serializable —
 * re-injecting unpartitioned would broaden scope); a `__Host-`/`__Secure-`
 * cookie violating its prefix rules (would fail the whole setCookies batch);
 * an oversized cookie.
 */
export declare function isInjectableCookie(c: CdpCookie, nowSecs?: number): boolean;
/**
 * Filter a captured cookie jar to the safely-injectable subset, then map each
 * survivor to setCookies input. Every inject path uses this so one malformed or
 * un-restorable cookie can't downgrade another or fail the whole batch.
 */
export declare function sanitizeCookiesForInject(cookies: CdpCookie[], nowSecs?: number): Record<string, unknown>[];
/**
 * Strip fields the CDP setCookies API doesn't accept on injection. The shape returned
 * by getCookies has metadata (size, session) that's not valid input.
 *
 * Exported so callers building their own setCookies batch (e.g. the per-origin
 * inject path in `inject.ts`) don't reimplement the same field-filtering logic.
 */
export declare function prepareCookieForInject(c: CdpCookie): Record<string, unknown>;
//# sourceMappingURL=cookie-helpers.d.ts.map