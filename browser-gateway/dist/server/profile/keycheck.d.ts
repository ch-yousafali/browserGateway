import { type Keycheck } from "../../core/profile/index.js";
export declare const KEYCHECK_FILE = ".keycheck";
export declare class KeycheckMismatchError extends Error {
    readonly storePath: string;
    readonly storedFingerprint: string;
    readonly providedFingerprint: string;
    constructor(storePath: string, storedFingerprint: string, providedFingerprint: string);
}
export interface OpenedStore {
    keycheck: Keycheck;
    kek: Buffer;
    dekByVersion: Map<number, Buffer>;
    currentDekVersion: number;
}
export declare function readKeycheck(storePath: string): Promise<Keycheck | null>;
export declare function writeKeycheck(storePath: string, kc: Keycheck): Promise<void>;
export declare function initStore(storePath: string, password: string): Promise<OpenedStore>;
export declare function openStore(storePath: string, password: string): Promise<OpenedStore>;
export declare function rewrapKeycheck(storePath: string, oldPassword: string, newPassword: string): Promise<void>;
//# sourceMappingURL=keycheck.d.ts.map