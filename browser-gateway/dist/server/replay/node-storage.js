import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
/** Node fs impl of ReplayStorage. Layout matches `ReplayStore` reader: */
/**   <storePath>/<sessionId>/meta.json                     */
/**   <storePath>/<sessionId>/parts/000.bin, 001.bin, ...   */
/**   <storePath>/<sessionId>/manifest.json                 */
/**   <storePath>/<sessionId>/complete.json                 */
export class NodeReplayStorage {
    storePath;
    constructor(storePath) {
        this.storePath = storePath;
    }
    async init(sessionId, meta) {
        const sessionDir = join(this.storePath, sessionId);
        const partsDir = join(sessionDir, "parts");
        await mkdir(partsDir, { recursive: true });
        await writeFile(join(sessionDir, "meta.json"), JSON.stringify(meta));
    }
    async writeChunk(sessionId, chunkIndex, data) {
        const partPath = join(this.storePath, sessionId, "parts", `${String(chunkIndex).padStart(3, "0")}.bin`);
        await writeFile(partPath, data);
    }
    async finalize(sessionId, manifest, summary) {
        const sessionDir = join(this.storePath, sessionId);
        await writeFile(join(sessionDir, "manifest.json"), JSON.stringify(manifest));
        await writeFile(join(sessionDir, "complete.json"), JSON.stringify(summary));
    }
}
//# sourceMappingURL=node-storage.js.map