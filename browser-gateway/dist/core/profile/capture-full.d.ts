import type { CdpCookie } from "./cdp.js";
import type { HelperPoolCdpClient } from "./helper-pool-client.js";
import type { OriginStorage, SkippedOrigin } from "./types.js";
export interface CaptureFullOptions {
    /** Number of helper pages used for parallel capture. Default 4. */
    helperPages?: number;
    /** Per-origin navigate + evaluate timeout (ms). Default 5_000. */
    perOriginTimeoutMs?: number;
    /** Total wall-clock budget (ms). Default 30_000. */
    totalTimeoutMs?: number;
    /** Also capture origins derived from the session's cookies. Default false. */
    includeCookieDerivedOrigins?: boolean;
    /** AbortSignal for cancellation. */
    signal?: AbortSignal;
}
export interface CaptureFullResult {
    cookies: CdpCookie[];
    storage: Record<string, OriginStorage>;
    skippedOrigins: SkippedOrigin[];
    durationMs: number;
}
/** Captures cookies and per-origin localStorage on an already-connected client. */
export declare function captureFullStateOnClient(client: HelperPoolCdpClient, originsToCapture: string[], opts?: Omit<CaptureFullOptions, "totalTimeoutMs">): Promise<CaptureFullResult>;
/** Opens its own WS to the provider, captures, then closes the WS. */
export declare function captureFullStateViaTransient(providerWsUrl: string, originsToCapture: string[], opts?: CaptureFullOptions): Promise<CaptureFullResult>;
/** Returns https origin candidates derived from a cookie list. */
export declare function originsFromCookies(cookies: CdpCookie[]): string[];
//# sourceMappingURL=capture-full.d.ts.map