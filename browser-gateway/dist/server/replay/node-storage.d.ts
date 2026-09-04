import type { ReplayStorage } from "../../pipeline/plugins/screencast-capture.js";
import type { ReplayManifest, ReplayMeta } from "./types.js";
/** Node fs impl of ReplayStorage. Layout matches `ReplayStore` reader: */
/**   <storePath>/<sessionId>/meta.json                     */
/**   <storePath>/<sessionId>/parts/000.bin, 001.bin, ...   */
/**   <storePath>/<sessionId>/manifest.json                 */
/**   <storePath>/<sessionId>/complete.json                 */
export declare class NodeReplayStorage implements ReplayStorage {
    private readonly storePath;
    constructor(storePath: string);
    init(sessionId: string, meta: ReplayMeta): Promise<void>;
    writeChunk(sessionId: string, chunkIndex: number, data: Uint8Array): Promise<void>;
    finalize(sessionId: string, manifest: ReplayManifest, summary: {
        endedAt: number;
        frameCount: number;
        sizeBytes: number;
        droppedFrames: number;
        duplicatesSkipped: number;
    }): Promise<void>;
}
//# sourceMappingURL=node-storage.d.ts.map