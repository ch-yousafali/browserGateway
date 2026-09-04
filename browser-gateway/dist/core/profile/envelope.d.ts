import { type WrappedDek } from "./types.js";
export declare function wrapDek(kek: Buffer, dek: Buffer, version: number): WrappedDek;
export declare function unwrapDek(kek: Buffer, wrapped: WrappedDek): Buffer;
export declare function newDek(): Buffer;
//# sourceMappingURL=envelope.d.ts.map