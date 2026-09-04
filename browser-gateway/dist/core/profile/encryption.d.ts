export interface AeadParts {
    iv: Buffer;
    ciphertext: Buffer;
    tag: Buffer;
}
export declare function aeadEncrypt(key: Buffer, plaintext: Buffer, aad?: Buffer): AeadParts;
export declare function aeadDecrypt(key: Buffer, iv: Buffer, ciphertext: Buffer, tag: Buffer, aad?: Buffer): Buffer;
export declare function generateDek(): Buffer;
//# sourceMappingURL=encryption.d.ts.map