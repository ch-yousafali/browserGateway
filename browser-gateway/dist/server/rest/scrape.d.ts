import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { SessionPool } from "../../core/pool/index.js";
import type { ProfileLifecycle } from "../profile/lifecycle.js";
import type { Context } from "hono";
export declare function handleScrape(c: Context, pool: SessionPool, gateway: Gateway, logger: Logger, profileLifecycle?: ProfileLifecycle): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        selectors?: {
            name: string;
            selector: string;
            results: {
                text: string;
                html: string;
                attribute?: string | undefined;
            }[];
        }[] | undefined;
        content?: {
            [x: string]: string;
        } | undefined;
        metadata?: {
            [x: string]: import("hono/utils/types").JSONValue;
        } | undefined;
        screenshot?: string | undefined;
        url: string;
        statusCode: number | null;
    };
    timings: {
        total: number;
        navigation: number;
        action: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=scrape.d.ts.map