export declare const MAGIC: Buffer<ArrayBuffer>;
export declare const BLOB_VERSION = 2;
export declare const BLOB_VERSION_V1 = 1;
export declare const ALG_AES_256_GCM = 1;
export declare const HEADER_LEN = 44;
export declare const COMPRESS_NONE = 0;
export declare const COMPRESS_GZIP = 1;
export interface EncodedBlob {
    bytes: Buffer;
    totalLen: number;
}
export interface DecodedHeader {
    version: number;
    alg: number;
    dekVersion: number;
    /** Compression alg (`COMPRESS_NONE` or `COMPRESS_GZIP`). Always 0 in v1 blobs. */
    compression: number;
    iv: Buffer;
    authTag: Buffer;
    aad: Buffer;
    ciphertext: Buffer;
}
export interface EncodeBlobOptions {
    /** Compress plaintext with gzip before AES-GCM. Default true. */
    compress?: boolean;
}
export declare function encodeBlob(dek: Buffer, dekVersion: number, plaintext: Buffer, profileId: string, opts?: EncodeBlobOptions): EncodedBlob;
export declare function decodeBlobHeader(blob: Buffer): DecodedHeader;
export declare function decodeBlob(blob: Buffer, dek: Buffer, expectedProfileId: string): Buffer;
//# sourceMappingURL=blob.d.ts.map