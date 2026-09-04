import { withBrowserPage } from "./executor.js";
import { withProfilePage } from "./profile-executor.js";
import { RestApiError } from "../../rest-schemas/index.js";
/**
 * If `profileId` is set, route through the profile-pinned executor; otherwise
 * use the pooled executor. `options.provider`, when set, pins the request to
 * one specific backend (no failover) — validated here so the failure modes
 * map to clean HTTP errors instead of leaking out of the pool.
 */
export async function dispatchPageAction(deps, profileId, options, action, runOpts = {}) {
    if (options.provider) {
        validateProviderPin(deps.gateway, options.provider, profileId !== undefined);
    }
    if (profileId) {
        if (!deps.profileLifecycle) {
            throw new RestApiError(400, "profile field used but profiles are not enabled on this gateway — set profiles.enabled: true in gateway.yml and configure BG_ENCRYPTION_KEY");
        }
        return withProfilePage({ gateway: deps.gateway, lifecycle: deps.profileLifecycle, logger: deps.logger }, profileId, { ...options, retries: 0 }, action, runOpts);
    }
    return withBrowserPage(deps.pool, deps.logger, options, action, runOpts);
}
/**
 * Validate `?provider=<id>` against the registry before any work starts:
 *
 *   - exists in gateway.yml?
 *   - if `profile` is also set, does the provider support `browserCookies`?
 *
 * Throws a 400 with a helpful message instead of letting the failure surface
 * mid-execution as a generic CDP error.
 */
function validateProviderPin(gateway, providerId, withProfile) {
    const provider = gateway.registry.get(providerId);
    if (!provider) {
        const available = gateway.registry.getAll().map((p) => p.id).join(", ") || "(none)";
        throw new RestApiError(400, `Provider '${providerId}' is not configured. Available providers: ${available}`);
    }
    if (withProfile) {
        const record = gateway.registry.getCapabilityRecord(providerId);
        const cookies = record?.capabilities?.browserCookies;
        if (cookies === "unsupported") {
            throw new RestApiError(400, `Provider '${providerId}' cannot serve profile requests — browserCookies is unsupported on this backend.`);
        }
    }
}
//# sourceMappingURL=dispatch.js.map