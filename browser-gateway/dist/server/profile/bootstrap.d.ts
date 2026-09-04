import type { Logger } from "pino";
import type { ProfilesConfig } from "../../core/types.js";
import { FilesystemProfileStore } from "./filesystem-store.js";
import { ProfileLifecycle } from "./lifecycle.js";
export interface ProfileBootstrap {
    enabled: true;
    lifecycle: ProfileLifecycle;
    store: FilesystemProfileStore;
    storePath: string;
    dekByVersion: ReadonlyMap<number, Buffer>;
    currentDekVersion: number;
}
export interface ProfileBootstrapDisabled {
    enabled: false;
}
export type ProfileBootstrapResult = ProfileBootstrap | ProfileBootstrapDisabled;
export declare class ProfileBootstrapError extends Error {
    readonly hint?: string | undefined;
    constructor(message: string, hint?: string | undefined);
}
/**
 * Bootstrap the profile subsystem from gateway config.
 *
 * - If profiles.enabled is false, returns { enabled: false } — no work done.
 * - Otherwise: reads BG_ENCRYPTION_KEY (or whatever encryption.keyEnv resolves to),
 *   ensures the store path exists, initializes a fresh .keycheck on first run, or
 *   opens an existing one and validates the key (KCV match).
 *
 * On KCV mismatch (= wrong key), throws ProfileBootstrapError pointing the operator
 * at "browser-gateway profile key rewrap" or instructions to start fresh.
 */
export declare function bootstrapProfiles(config: ProfilesConfig, logger: Logger): Promise<ProfileBootstrapResult>;
/**
 * Resolve the profile store path with `BG_DATA_DIR` env override.
 *
 * Absolute config paths win (operator knows what they want). Relative paths
 * are joined under the resolved data directory — `/data` in Docker,
 * `~/.browser-gateway` outside, or whatever `BG_DATA_DIR` points to.
 */
export declare function resolveStorePath(configPath: string): string;
//# sourceMappingURL=bootstrap.d.ts.map