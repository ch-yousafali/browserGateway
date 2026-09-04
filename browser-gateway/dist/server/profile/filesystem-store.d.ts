import { type ProfileMeta } from "../../core/profile/index.js";
import type { LockToken, ProfileStore } from "../../core/profile/store.js";
export interface FilesystemStoreOptions {
    storePath: string;
    /** Lock TTL in ms — abandoned locks are reclaimed after this. */
    staleLockMs?: number;
}
export declare class FilesystemProfileStore implements ProfileStore {
    private readonly root;
    private readonly staleLockMs;
    private readonly locks;
    constructor(opts: FilesystemStoreOptions);
    getRaw(id: string): Promise<Buffer | null>;
    putRaw(id: string, blob: Buffer): Promise<void>;
    delete(id: string): Promise<void>;
    list(): Promise<ProfileMeta[]>;
    lock(id: string, ttlMs: number): Promise<LockToken | null>;
    unlock(_id: string, token: LockToken): Promise<void>;
    private profileDir;
    private profilePath;
    private assertProfileId;
    private assertFreeSpace;
    private isLockHeldError;
}
//# sourceMappingURL=filesystem-store.d.ts.map