import type { Page } from "playwright-core";
import type { Logger } from "pino";
import type { SessionPool } from "../../core/pool/index.js";
export interface PageOptions {
    url: string;
    viewport?: {
        width: number;
        height: number;
    };
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    waitForSelector?: string;
    waitForTimeout?: number;
    timeout?: number;
    headers?: Record<string, string>;
    userAgent?: string;
    retries?: number;
    signal?: AbortSignal;
    /**
     * Pin this request to a specific provider id. When set, the gateway opens a
     * one-shot CDP connection to that backend and the request will either run
     * there or fail — no failover to other providers. Validated upstream by
     * `dispatchPageAction`.
     */
    provider?: string;
}
export interface PageResult<T> {
    data: T;
    statusCode: number | null;
    resolvedUrl: string;
    timings: {
        total: number;
        navigation: number;
        action: number;
    };
    attempt: number;
}
export declare function withBrowserPage<T>(pool: SessionPool, logger: Logger, options: PageOptions, action: (page: Page) => Promise<T>, runOpts?: {
    tolerateGotoTimeout?: boolean;
}): Promise<PageResult<T>>;
export declare function scrollThroughPage(page: Page): Promise<void>;
//# sourceMappingURL=executor.d.ts.map