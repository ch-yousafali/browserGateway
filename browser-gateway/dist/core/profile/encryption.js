import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const ALGO = "aes-256-gcm";
const IV_LEN = 12;
const TAG_LEN = 16;
const KEY_LEN = 32;
export function aeadEncrypt(key, plaintext, aad) {
    if (key.length !== KEY_LEN) {
        throw new Error(`key must be ${KEY_LEN} bytes, got ${key.length}`);
    }
    const iv = randomBytes(IV_LEN);
    const cipher = createCipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
    if (aad && aad.length > 0)
        cipher.setAAD(aad);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return { iv, ciphertext, tag };
}
export function aeadDecrypt(key, iv, ciphertext, tag, aad) {
    if (key.length !== KEY_LEN) {
        throw new Error(`key must be ${KEY_LEN} bytes, got ${key.length}`);
    }
    if (iv.length !== IV_LEN) {
        throw new Error(`iv must be ${IV_LEN} bytes, got ${iv.length}`);
    }
    if (tag.length !== TAG_LEN) {
        throw new Error(`tag must be ${TAG_LEN} bytes, got ${tag.length}`);
    }
    const decipher = createDecipheriv(ALGO, key, iv, { authTagLength: TAG_LEN });
    if (aad && aad.length > 0)
        decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}
export function generateDek() {
    return randomBytes(KEY_LEN);
}
//# sourceMappingURL=encryption.js.map