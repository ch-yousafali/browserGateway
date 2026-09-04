import { Hono } from "hono";
import type { Logger } from "pino";
import type { FilesystemProfileStore } from "../profile/filesystem-store.js";
import type { GatewayConfig } from "../../core/types.js";
export interface ProfileRestDeps {
    store: FilesystemProfileStore;
    dekByVersion: ReadonlyMap<number, Buffer>;
    logger: Logger;
    config?: GatewayConfig;
}
export interface DisabledProfileDeps {
    /** Live gateway config — `enableProfilesFlow` updates `config.profiles.enabled` so subsequent writes preserve the block. */
    config?: GatewayConfig;
    /** Last profile-bootstrap error string, if bootstrap failed at startup. Distinguishes "config off" from "config on but broken". */
    bootstrapError?: string;
}
/**
 * Profile routes that respond gracefully when the profiles feature is OFF.
 *
 *   GET /profiles               → 200 { enabled: false, count: 0, profiles: [] }
 *   GET /profiles/:id           → 404
 *   DELETE /profiles/:id        → 400 with disabled reason
 *   GET /profiles/:id/export    → 400 with disabled reason
 *   POST /profiles/import       → 400 with disabled reason
 *
 * The list endpoint returns 200 (not 503) so dashboards can render an empty
 * state with a "feature disabled" banner instead of throwing an error.
 */
export declare function createDisabledProfileRoutes(deps?: DisabledProfileDeps): Hono;
/**
 * Profile management REST routes.
 *
 *  GET    /profiles              → list metadata (no payload)
 *  GET    /profiles/:id          → single profile metadata
 *  DELETE /profiles/:id          → delete (refuses if currently locked)
 *  GET    /profiles/:id/export   → download encrypted blob as binary
 *  POST   /profiles/import       → upload encrypted blob; id taken from blob AAD
 *
 * Mounted by the caller under /v1.
 *
 * Authentication is handled by the parent app's /v1/* middleware.
 */
export declare function createProfileRoutes(deps: ProfileRestDeps): Hono;
//# sourceMappingURL=profiles.d.ts.map