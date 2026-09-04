import type { Logger } from "pino";
import { ReplayStore } from "./store.js";
export interface ReplayRetentionOpts {
    store: ReplayStore;
    storePath: string;
    retentionDays: number;
    incompleteGraceMs?: number;
    logger: Logger;
    now?: () => number;
}
export declare class ReplayRetention {
    private readonly opts;
    private timer;
    constructor(opts: ReplayRetentionOpts);
    start(intervalMs?: number): void;
    stop(): void;
    runOnce(): {
        purged: string[];
        kept: string[];
    };
}
//# sourceMappingURL=retention.d.ts.map