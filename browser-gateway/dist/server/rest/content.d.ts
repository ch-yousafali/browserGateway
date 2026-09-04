import type { Logger } from "pino";
import type { Gateway } from "../../core/index.js";
import type { SessionPool } from "../../core/pool/index.js";
import type { ProfileLifecycle } from "../profile/lifecycle.js";
import type { Context } from "hono";
export declare function handleContent(c: Context, pool: SessionPool, gateway: Gateway, logger: Logger, profileLifecycle?: ProfileLifecycle): Promise<Response & import("hono").TypedResponse<{
    success: true;
    data: {
        content: {
            [x: string]: string;
        };
        metadata: {
            [x: string]: import("hono/utils/types").JSONValue;
        };
        links: {
            url: string;
            text: string;
        }[];
        url: string;
        statusCode: number | null;
    };
    timings: {
        total: number;
        navigation: number;
        action: number;
    };
}, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=content.d.ts.map