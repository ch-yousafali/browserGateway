import type { CapturedProfile } from "../../core/profile/index.js";
import type { ProfileStore } from "../../core/profile/store.js";
import type { LoadedProfile, LockToken, ProfileStorage } from "../../pipeline/plugins/profile-storage.js";
/** Node-side {@link ProfileStorage} adapter. Wraps the existing
 *  {@link ProfileStore} (filesystem-backed today) + a DEK key ring for
 *  encryption/decryption. Pairs with the OSS server tier. */
export declare class NodeProfileStorage implements ProfileStorage {
    private readonly store;
    private readonly dekByVersion;
    private readonly currentDekVersion;
    constructor(store: ProfileStore, dekByVersion: ReadonlyMap<number, Buffer>, currentDekVersion: number);
    load(profileId: string): Promise<LoadedProfile | null>;
    save(profileId: string, profile: CapturedProfile): Promise<void>;
    acquireLock(profileId: string, ttlMs: number): Promise<LockToken | null>;
    releaseLock(profileId: string, token: LockToken): Promise<void>;
}
//# sourceMappingURL=node-profile-storage.d.ts.map