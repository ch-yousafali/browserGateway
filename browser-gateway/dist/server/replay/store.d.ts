import type { ReplayDetail, ReplayManifest, ReplayMeta } from "./types.js";
export interface ListOpts {
    sinceMs?: number;
    limit?: number;
}
export declare class ReplayStore {
    private readonly storePath;
    constructor(storePath: string);
    exists(): boolean;
    list(opts?: ListOpts): ReplayMeta[];
    get(sessionId: string): ReplayDetail | null;
    manifestPath(sessionId: string): string;
    partPath(sessionId: string, chunkIndex: number): string;
    readManifest(sessionId: string): ReplayManifest | null;
    readFrame(sessionId: string, frameNumber: number): Buffer | null;
    delete(sessionId: string): void;
    sessionSizeBytes(sessionId: string): number;
    private readMeta;
}
//# sourceMappingURL=store.d.ts.map