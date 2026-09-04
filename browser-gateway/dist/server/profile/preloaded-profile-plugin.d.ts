import type { Logger } from "pino";
import { ProfilePlugin } from "../../pipeline/plugins/profile.js";
import type { AcquiredProfile, ProfileLifecycle } from "./lifecycle.js";
/** Wraps an already-acquired profile as a preloaded {@link ProfilePlugin}.
 *  The caller owns the lock lifecycle via {@link ProfileLifecycle}; the
 *  plugin handles inject + capture on the pipeline's CDP connection. */
export declare function makeProfilePluginFromAcquired(acquired: AcquiredProfile, profileLifecycle: ProfileLifecycle, logger: Logger, opts?: {
    providerId?: string;
    skipResidueCheck?: boolean;
}): ProfilePlugin;
//# sourceMappingURL=preloaded-profile-plugin.d.ts.map