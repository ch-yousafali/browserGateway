import { z } from "zod";
export const PROFILE_ID_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/;
export const ProfileIdSchema = z
    .string()
    .regex(PROFILE_ID_REGEX, "profile id must match /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/");
export const PROFILE_VERSION = 1;
export const DEFAULT_KDF_PARAMS = {
    algorithm: "scrypt",
    N: 32768,
    r: 8,
    p: 1,
    saltB64: "",
    keyLen: 32,
};
export const KeycheckSchema = z.object({
    version: z.literal(1),
    kdf: z.object({
        algorithm: z.literal("scrypt"),
        N: z.number().int().positive(),
        r: z.number().int().positive(),
        p: z.number().int().positive(),
        saltB64: z.string().min(1),
        keyLen: z.number().int().positive(),
    }),
    kekFingerprintB64: z.string().min(1),
    kcvB64: z.string().min(1),
    wrappedDeks: z.array(z.object({
        version: z.number().int().positive(),
        wrappedB64: z.string().min(1),
        ivB64: z.string().min(1),
        tagB64: z.string().min(1),
    })).min(1),
    createdAt: z.string(),
    updatedAt: z.string(),
});
//# sourceMappingURL=types.js.map