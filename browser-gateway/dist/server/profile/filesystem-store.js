import { readFile, mkdir, rm, readdir, stat, lstat, statfs } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import writeFileAtomic from "write-file-atomic";
import lockfile from "proper-lockfile";
import { PROFILE_ID_REGEX, decodeBlobHeader, } from "../../core/profile/index.js";
import { KEYCHECK_FILE } from "./keycheck.js";
/**
 * Profile ids the user must never be allowed to use, because they'd collide
 * with our metadata files at the same nesting level. Add to this list if you
 * add new metadata files at the store root.
 */
const RESERVED_PROFILE_IDS = new Set([
    KEYCHECK_FILE, // ".keycheck"
    KEYCHECK_FILE.slice(1), // "keycheck" — case-sensitive intentional
]);
export class FilesystemProfileStore {
    root;
    staleLockMs;
    locks = new Map();
    constructor(opts) {
        this.root = resolve(opts.storePath);
        this.staleLockMs = opts.staleLockMs ?? 30_000;
    }
    async getRaw(id) {
        this.assertProfileId(id);
        const path = this.profilePath(id);
        if (!existsSync(path))
            return null;
        const lst = await lstat(path);
        if (lst.isSymbolicLink()) {
            throw new Error(`profile path is a symlink (refusing to follow): ${path}`);
        }
        if (!lst.isFile()) {
            throw new Error(`profile path is not a regular file: ${path}`);
        }
        return readFile(path);
    }
    async putRaw(id, blob) {
        this.assertProfileId(id);
        const dir = this.profileDir(id);
        await mkdir(dir, { recursive: true, mode: 0o700 });
        const path = this.profilePath(id);
        if (existsSync(path)) {
            const lst = await lstat(path);
            if (lst.isSymbolicLink()) {
                throw new Error(`refusing to overwrite symlinked profile path: ${path}`);
            }
        }
        decodeBlobHeader(blob);
        await this.assertFreeSpace(dir, blob.length);
        await writeFileAtomic(path, blob, { mode: 0o600 });
        const final = await lstat(path);
        if (final.isSymbolicLink() || !final.isFile()) {
            throw new Error(`post-write check failed at ${path}: not a regular file`);
        }
    }
    async delete(id) {
        this.assertProfileId(id);
        const dir = this.profileDir(id);
        if (!existsSync(dir))
            return;
        const lst = await lstat(dir);
        if (lst.isSymbolicLink()) {
            throw new Error(`refusing to delete via symlink: ${dir}`);
        }
        await rm(dir, { recursive: true, force: true });
    }
    async list() {
        if (!existsSync(this.root))
            return [];
        const entries = await readdir(this.root, { withFileTypes: true });
        const out = [];
        for (const ent of entries) {
            if (!ent.isDirectory())
                continue;
            if (ent.name.startsWith("."))
                continue;
            if (!PROFILE_ID_REGEX.test(ent.name))
                continue;
            const path = this.profilePath(ent.name);
            if (!existsSync(path))
                continue;
            try {
                const st = await stat(path);
                const blob = await readFile(path);
                const header = decodeBlobHeader(blob);
                out.push({
                    id: ent.name,
                    updatedAt: st.mtime.toISOString(),
                    sizeBytes: st.size,
                    dekVersion: header.dekVersion,
                });
            }
            catch {
                // Skip corrupted entries silently from list — they're surfaced on get
            }
        }
        return out;
    }
    async lock(id, ttlMs) {
        this.assertProfileId(id);
        const dir = this.profileDir(id);
        await mkdir(dir, { recursive: true, mode: 0o700 });
        try {
            const release = await lockfile.lock(dir, {
                stale: this.staleLockMs,
                realpath: false,
                retries: 0,
                update: Math.min(this.staleLockMs / 2, ttlMs),
            });
            const token = `${id}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
            this.locks.set(token, release);
            return token;
        }
        catch (err) {
            if (this.isLockHeldError(err))
                return null;
            throw err;
        }
    }
    async unlock(_id, token) {
        const release = this.locks.get(token);
        if (!release)
            return;
        this.locks.delete(token);
        try {
            await release();
        }
        catch {
            // Best-effort release. Stale lock TTL handles forgotten unlocks.
        }
    }
    profileDir(id) {
        return join(this.root, id);
    }
    profilePath(id) {
        return join(this.profileDir(id), "data.enc");
    }
    assertProfileId(id) {
        if (RESERVED_PROFILE_IDS.has(id)) {
            throw new Error(`profile id "${id}" is reserved`);
        }
        if (!PROFILE_ID_REGEX.test(id)) {
            throw new Error(`invalid profile id: "${id}"`);
        }
        const resolved = resolve(this.root, id);
        if (!resolved.startsWith(this.root + sep) && resolved !== this.root) {
            throw new Error(`profile id escapes store root: "${id}"`);
        }
    }
    async assertFreeSpace(dir, neededBytes) {
        try {
            const s = await statfs(dir);
            const free = Number(s.bsize) * Number(s.bavail);
            if (free < neededBytes * 2) {
                throw new Error(`insufficient disk space at ${dir}: need ${neededBytes}B, free ${free}B`);
            }
        }
        catch (err) {
            if (err instanceof Error && err.message.includes("insufficient disk space"))
                throw err;
            // statfs unavailable on some platforms — proceed without the check
        }
    }
    isLockHeldError(err) {
        if (!err || typeof err !== "object")
            return false;
        const code = err.code;
        return code === "ELOCKED" || code === "EEXIST";
    }
}
//# sourceMappingURL=filesystem-store.js.map