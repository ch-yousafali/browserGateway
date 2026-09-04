import type { Logger } from "pino";
export interface ResolvedEncryptionKey {
    /** The base64 key string passed downstream to scrypt-KDF. */
    value: string;
    /** Where it came from — used by callers for log lines / dashboard hints. */
    source: "env" | "file" | "generated";
    /** Absolute path the key was loaded from or written to (null for env). */
    path: string | null;
}
/**
 * Resolve the gateway's profile-encryption key. Chain:
 *
 *   1. `BG_ENCRYPTION_KEY` env var (enterprise: Vault, AWS SM, etc.)
 *   2. `${BG_DATA_DIR}/.encryption-key` file (auto-managed, persists across boots)
 *   3. Fresh `crypto.randomBytes(32).toString("base64")`, written to the file
 *      with mode 0600
 *
 * If both env var and file exist with DIFFERENT values, env wins and a warning
 * is logged — profiles encrypted with the file key will then fail to decrypt,
 * and the user is told that explicitly.
 */
export declare function resolveEncryptionKey(logger?: Logger): ResolvedEncryptionKey;
//# sourceMappingURL=encryption-key.d.ts.map