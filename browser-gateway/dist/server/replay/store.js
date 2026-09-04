import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";
const META_FILE = "meta.json";
const COMPLETE_FILE = "complete.json";
const MANIFEST_FILE = "manifest.json";
const PARTS_DIR = "parts";
export class ReplayStore {
    storePath;
    constructor(storePath) {
        this.storePath = storePath;
    }
    exists() {
        return existsSync(this.storePath);
    }
    list(opts = {}) {
        if (!existsSync(this.storePath))
            return [];
        const limit = opts.limit ?? 100;
        const sinceMs = opts.sinceMs ?? 0;
        const entries = [];
        for (const sessionId of readdirSync(this.storePath)) {
            const meta = this.readMeta(sessionId);
            if (!meta)
                continue;
            if (meta.startedAt < sinceMs)
                continue;
            entries.push(meta);
        }
        entries.sort((a, b) => b.startedAt - a.startedAt);
        return entries.slice(0, limit);
    }
    get(sessionId) {
        const meta = this.readMeta(sessionId);
        if (!meta)
            return null;
        const manifest = this.readManifest(sessionId);
        const targets = [];
        if (manifest) {
            const perTarget = new Map();
            for (const frame of manifest.frames) {
                const entry = perTarget.get(frame.targetId) ?? { count: 0, size: 0 };
                entry.count++;
                entry.size += frame.sizeBytes;
                if (!entry.firstUrl && frame.url)
                    entry.firstUrl = frame.url;
                if (frame.url)
                    entry.lastUrl = frame.url;
                perTarget.set(frame.targetId, entry);
            }
            for (const [targetId, entry] of perTarget) {
                targets.push({
                    targetId,
                    frameCount: entry.count,
                    sizeBytes: entry.size,
                    firstUrl: entry.firstUrl,
                    lastUrl: entry.lastUrl,
                });
            }
        }
        return { ...meta, targets };
    }
    manifestPath(sessionId) {
        return join(this.storePath, sessionId, MANIFEST_FILE);
    }
    partPath(sessionId, chunkIndex) {
        return join(this.storePath, sessionId, PARTS_DIR, `${String(chunkIndex).padStart(3, "0")}.bin`);
    }
    readManifest(sessionId) {
        const path = this.manifestPath(sessionId);
        if (!existsSync(path))
            return null;
        try {
            return JSON.parse(readFileSync(path, "utf8"));
        }
        catch {
            return null;
        }
    }
    readFrame(sessionId, frameNumber) {
        const manifest = this.readManifest(sessionId);
        if (!manifest)
            return null;
        const record = manifest.frames.find((f) => f.frame === frameNumber);
        if (!record)
            return null;
        const partPath = this.partPath(sessionId, record.chunkIndex);
        if (!existsSync(partPath))
            return null;
        const part = readFileSync(partPath);
        return part.subarray(record.byteOffset + 4, record.byteOffset + 4 + record.length);
    }
    delete(sessionId) {
        const dir = join(this.storePath, sessionId);
        rmSync(dir, { recursive: true, force: true });
    }
    sessionSizeBytes(sessionId) {
        const dir = join(this.storePath, sessionId);
        if (!existsSync(dir))
            return 0;
        return walkDirSize(dir);
    }
    readMeta(sessionId) {
        const sessionDir = join(this.storePath, sessionId);
        const metaPath = join(sessionDir, META_FILE);
        if (!existsSync(metaPath))
            return null;
        let raw;
        try {
            raw = JSON.parse(readFileSync(metaPath, "utf8"));
        }
        catch {
            return null;
        }
        if (!raw.format)
            raw.format = "png";
        const completePath = join(sessionDir, COMPLETE_FILE);
        if (existsSync(completePath)) {
            try {
                const done = JSON.parse(readFileSync(completePath, "utf8"));
                return { ...raw, ...done, complete: true };
            }
            catch {
                return { ...raw, complete: true };
            }
        }
        return { ...raw, complete: false };
    }
}
function walkDirSize(dir) {
    let total = 0;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory())
            total += walkDirSize(p);
        else if (entry.isFile())
            total += statSync(p).size;
    }
    return total;
}
//# sourceMappingURL=store.js.map