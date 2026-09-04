import { z } from "zod";
import type { CdpCookie } from "./cdp.js";
export type { CdpCookie, CDPClient } from "./cdp.js";
export declare const PROFILE_ID_REGEX: RegExp;
export declare const ProfileIdSchema: z.ZodString;
export type ProfileId = z.infer<typeof ProfileIdSchema>;
export declare const PROFILE_VERSION: 1;
/**
 * Captured browser state suitable for cross-session replay.
 *
 * Storage is keyed by origin (e.g. "https://github.com"). Only origins we explicitly
 * captured appear here. Skipped origins (network errors, runtime errors) don't
 * appear at all — capture is best-effort per origin.
 */
export interface CapturedProfile {
    version: typeof PROFILE_VERSION;
    capturedAt: string;
    cookies: CdpCookie[];
    storage: Record<string, OriginStorage>;
    meta: ProfileCaptureMeta;
    /**
     * browserserve-native layer (IndexedDB + service-worker files), as an opaque
     * relative-path/base64 manifest. Only populated by browserserve providers;
     * external providers cannot carry it. Absent on older profiles.
     */
    indexeddb?: BrowserserveFile[];
}
/** One file in a browserserve native-layer manifest (relative path + base64). */
export interface BrowserserveFile {
    path: string;
    bytes: string;
}
export interface OriginStorage {
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    /**
     * ISO timestamp of the most recent session that touched this origin. Used
     * to rank origins for eager inject (top-K by recency). Optional for
     * backward compatibility — older profiles default to a zero-timestamp rank.
     */
    lastVisitedAt?: string;
}
export interface ProfileCaptureMeta {
    userAgent?: string;
    capturedOrigins: string[];
    skippedOrigins: SkippedOrigin[];
    durationMs: number;
}
export interface SkippedOrigin {
    origin: string;
    reason: string;
}
export interface ProfileMeta {
    id: ProfileId;
    updatedAt: string;
    sizeBytes: number;
    dekVersion: number;
}
export interface KdfParams {
    algorithm: "scrypt";
    N: number;
    r: number;
    p: number;
    saltB64: string;
    keyLen: number;
}
export declare const DEFAULT_KDF_PARAMS: KdfParams;
export interface WrappedDek {
    version: number;
    wrappedB64: string;
    ivB64: string;
    tagB64: string;
}
export interface Keycheck {
    version: 1;
    kdf: KdfParams;
    kekFingerprintB64: string;
    kcvB64: string;
    wrappedDeks: WrappedDek[];
    createdAt: string;
    updatedAt: string;
}
export declare const KeycheckSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    kdf: z.ZodObject<{
        algorithm: z.ZodLiteral<"scrypt">;
        N: z.ZodNumber;
        r: z.ZodNumber;
        p: z.ZodNumber;
        saltB64: z.ZodString;
        keyLen: z.ZodNumber;
    }, z.core.$strip>;
    kekFingerprintB64: z.ZodString;
    kcvB64: z.ZodString;
    wrappedDeks: z.ZodArray<z.ZodObject<{
        version: z.ZodNumber;
        wrappedB64: z.ZodString;
        ivB64: z.ZodString;
        tagB64: z.ZodString;
    }, z.core.$strip>>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=types.d.ts.map