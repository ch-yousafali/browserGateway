import type { CdpCookie } from "../../core/profile/cdp.js";
import type { BrowserserveFile, OriginStorage } from "../../core/profile/types.js";
import type { AcquiredProfile } from "./lifecycle.js";
/** The profile shape browserserve's `/v1/profile` accepts and returns. */
export interface BrowserservePayload {
    cookies: CdpCookie[];
    localStorage: {
        origin: string;
        localStorage: {
            name: string;
            value: string;
        }[];
    }[];
    indexeddb: BrowserserveFile[];
}
/** Derives the HTTP base and auth token from a provider `ws(s)://…?token=` URL. */
export declare function browserserveHttp(wsUrl: string): {
    base: string;
    authToken: string | null;
};
/** Adds `?profileToken=` to a provider connect URL. */
export declare function withProfileToken(wsUrl: string, token: string): string;
/** Maps the gateway's acquired profile to browserserve's payload shape. */
export declare function toBrowserservePayload(acquired: AcquiredProfile): BrowserservePayload;
/** Maps a browserserve captured payload back to the gateway's stored shape. */
export declare function fromBrowserservePayload(payload: BrowserservePayload): {
    cookies: CdpCookie[];
    storage: Record<string, OriginStorage>;
    indexeddb: BrowserserveFile[];
};
/** Drops a profile at browserserve and returns its one-shot token. */
export declare function dropOffProfile(base: string, authToken: string | null, payload: BrowserservePayload, timeoutMs?: number): Promise<string>;
/**
 * Picks up the captured profile once the session ends, polling past 404 until
 * browserserve deposits it. Returns null if it never arrives in time (the
 * caller then preserves the previous profile).
 */
export declare function pickUpProfile(base: string, authToken: string | null, token: string, timeoutMs?: number): Promise<BrowserservePayload | null>;
//# sourceMappingURL=browserserve-channel.d.ts.map