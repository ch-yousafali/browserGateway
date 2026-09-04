import { decodeBlob, decodeBlobHeader, encodeBlob, } from "../../core/profile/index.js";
/** Node-side {@link ProfileStorage} adapter. Wraps the existing
 *  {@link ProfileStore} (filesystem-backed today) + a DEK key ring for
 *  encryption/decryption. Pairs with the OSS server tier. */
export class NodeProfileStorage {
    store;
    dekByVersion;
    currentDekVersion;
    constructor(store, dekByVersion, currentDekVersion) {
        this.store = store;
        this.dekByVersion = dekByVersion;
        this.currentDekVersion = currentDekVersion;
    }
    async load(profileId) {
        const blob = await this.store.getRaw(profileId);
        if (!blob)
            return null;
        const header = decodeBlobHeader(blob);
        const dek = this.dekByVersion.get(header.dekVersion);
        if (!dek) {
            throw new Error(`profile blob references DEK version ${header.dekVersion} not in key ring`);
        }
        let plaintext;
        try {
            plaintext = decodeBlob(blob, dek, profileId);
        }
        catch (err) {
            throw new Error(`failed to decrypt profile: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
        }
        let profile;
        try {
            profile = JSON.parse(plaintext.toString("utf-8"));
        }
        catch (err) {
            throw new Error(`profile decoded but JSON malformed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
        }
        return { profile, dekVersion: header.dekVersion };
    }
    async save(profileId, profile) {
        const dek = this.dekByVersion.get(this.currentDekVersion);
        if (!dek) {
            throw new Error(`current DEK version ${this.currentDekVersion} missing from key ring`);
        }
        const plaintext = Buffer.from(JSON.stringify(profile), "utf-8");
        const { bytes } = encodeBlob(dek, this.currentDekVersion, plaintext, profileId);
        await this.store.putRaw(profileId, bytes);
    }
    async acquireLock(profileId, ttlMs) {
        return this.store.lock(profileId, ttlMs);
    }
    async releaseLock(profileId, token) {
        await this.store.unlock(profileId, token);
    }
}
//# sourceMappingURL=node-profile-storage.js.map