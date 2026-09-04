import type { z } from "zod";
import { type GatewayConfig, type ProviderConfig } from "../core/types.js";
/**
 * Format a Zod error into a human-readable list of "path: message" strings.
 * Used by every REST handler that does `safeParse`. Extracted so the error
 * format stays consistent across endpoints.
 */
export declare function formatZodErrors(error: z.ZodError): string[];
/**
 * Parse a provider config body (from POST or PUT /v1/providers/...).
 *
 * @param body         raw JSON body from the request
 * @param existing     existing provider config (PUT only — used to merge)
 * @returns            either parsed ProviderConfig data or formatted error
 */
export declare function parseProviderConfigBody(body: Record<string, unknown>, existing?: ProviderConfig): {
    data: ProviderConfig;
    errors?: undefined;
} | {
    data?: undefined;
    errors: string[];
};
/** Validate a webhook request body against {@link WebhookSchema}. */
export declare function parseWebhookBody(body: Record<string, unknown>): {
    data: {
        url: string;
        events?: string[];
    };
    errors?: undefined;
} | {
    data?: undefined;
    errors: string[];
};
/**
 * Parse a YAML string and validate it against {@link GatewayConfigSchema}.
 *
 * Returns one of three discriminated outcomes:
 *   - parse error (invalid YAML)
 *   - validation error (well-formed YAML but invalid structure)
 *   - success (valid config)
 */
export declare function parseYamlGatewayConfig(yaml: string): Promise<{
    kind: "parse-error";
    message: string;
} | {
    kind: "validation-error";
    errors: string[];
} | {
    kind: "ok";
    data: GatewayConfig;
}>;
//# sourceMappingURL=validation.d.ts.map