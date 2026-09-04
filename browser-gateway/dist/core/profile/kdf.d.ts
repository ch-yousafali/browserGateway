import { type KdfParams } from "./types.js";
export declare function newKdfParams(overrides?: Partial<KdfParams>): KdfParams;
export declare function deriveKek(password: string, params: KdfParams): Buffer;
export declare function kekFingerprint(kek: Buffer): string;
//# sourceMappingURL=kdf.d.ts.map