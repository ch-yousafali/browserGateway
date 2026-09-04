import { GatewayConfigSchema, ProviderConfigSchema, WebhookSchema, } from "../core/types.js";
/**
 * Format a Zod error into a human-readable list of "path: message" strings.
 * Used by every REST handler that does `safeParse`. Extracted so the error
 * format stays consistent across endpoints.
 */
export function formatZodErrors(error) {
    return error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}
/**
 * Parse a provider config body (from POST or PUT /v1/providers/...).
 *
 * @param body         raw JSON body from the request
 * @param existing     existing provider config (PUT only — used to merge)
 * @returns            either parsed ProviderConfig data or formatted error
 */
export function parseProviderConfigBody(body, existing) {
    const url = body.url;
    const maxConcurrent = body.maxConcurrent;
    const priority = body.priority;
    const weight = body.weight;
    const profile = body.profile;
    const multiProfile = body.multiProfile;
    const headers = body.headers;
    const candidate = {
        url: url ?? existing?.url,
        limits: maxConcurrent !== undefined
            ? { maxConcurrent }
            : existing?.limits,
        priority: priority ?? existing?.priority ?? 1,
        weight: weight ?? existing?.weight ?? 1,
        profile: profile === null ? undefined : (profile ?? existing?.profile),
        multiProfile: multiProfile ?? existing?.multiProfile ?? false,
        headers: headers === null ? undefined : (headers ?? existing?.headers),
    };
    const parsed = ProviderConfigSchema.safeParse(candidate);
    if (!parsed.success) {
        return { errors: formatZodErrors(parsed.error) };
    }
    return { data: parsed.data };
}
/** Validate a webhook request body against {@link WebhookSchema}. */
export function parseWebhookBody(body) {
    const parsed = WebhookSchema.safeParse(body);
    if (!parsed.success) {
        return { errors: formatZodErrors(parsed.error) };
    }
    return { data: parsed.data };
}
/**
 * Parse a YAML string and validate it against {@link GatewayConfigSchema}.
 *
 * Returns one of three discriminated outcomes:
 *   - parse error (invalid YAML)
 *   - validation error (well-formed YAML but invalid structure)
 *   - success (valid config)
 */
export async function parseYamlGatewayConfig(yaml) {
    const { parse } = await import("yaml");
    let parsed;
    try {
        parsed = parse(yaml);
    }
    catch (err) {
        return { kind: "parse-error", message: err.message };
    }
    const result = GatewayConfigSchema.safeParse(parsed);
    if (!result.success) {
        return { kind: "validation-error", errors: formatZodErrors(result.error) };
    }
    return { kind: "ok", data: result.data };
}
//# sourceMappingURL=validation.js.map