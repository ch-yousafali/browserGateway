import type { Context } from "hono";
import type { GatewayConfig } from "../../core/types.js";
export type ToggleFlow<R> = (input: {
    configPath: string;
    config: GatewayConfig;
}) => R;
export declare function makeToggleHandler<R>(getConfig: () => GatewayConfig | undefined, flow: ToggleFlow<R>, missingConfigError: string, failureLabel: string): (c: Context) => Promise<(Response & import("hono").TypedResponse<{
    error: string;
}, 400, "json">) | (Response & import("hono").TypedResponse<import("hono/utils/types").JSONParsed<R, bigint | readonly bigint[]>, import("hono/utils/http-status").ContentfulStatusCode, "json">)>;
//# sourceMappingURL=toggle-handler.d.ts.map