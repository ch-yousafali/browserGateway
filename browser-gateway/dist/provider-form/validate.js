import { HEADER_LIMITS, PROVIDER_LIMITS } from "./types.js";
const URL_SCHEME_PATTERN = /^(ws|wss|http|https):\/\//;
export function slugifyProviderName(input) {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, PROVIDER_LIMITS.slugMaxLength);
}
export function isValidProviderUrl(value) {
    return URL_SCHEME_PATTERN.test(value.trim());
}
export function validateProviderSlug(slug) {
    if (!slug)
        return "Give this provider a name.";
    if (slug.length < PROVIDER_LIMITS.slugMinLength)
        return "Name is too short.";
    if (slug.length > PROVIDER_LIMITS.slugMaxLength)
        return `Name must be ${PROVIDER_LIMITS.slugMaxLength} characters or fewer.`;
    if (!PROVIDER_LIMITS.slugPattern.test(slug))
        return "Lowercase letters, numbers, and hyphens only.";
    return null;
}
export function validateProviderUrl(url) {
    const trimmed = url.trim();
    if (!trimmed)
        return "Enter the URL for this provider.";
    if (!isValidProviderUrl(trimmed))
        return "URL must start with ws://, wss://, http://, or https://.";
    return null;
}
export function validatePositiveInteger(value, fieldLabel) {
    if (!value.trim())
        return null;
    const n = Number(value);
    if (Number.isNaN(n) || !Number.isFinite(n))
        return `${fieldLabel} must be a number.`;
    if (!Number.isInteger(n))
        return `${fieldLabel} must be a whole number.`;
    if (n < 1)
        return `${fieldLabel} must be at least 1.`;
    return null;
}
export function validateHeaderRows(rows) {
    const filled = rows.filter((h) => h.key.trim() || h.value);
    if (filled.length > HEADER_LIMITS.maxHeaders)
        return `Up to ${HEADER_LIMITS.maxHeaders} headers.`;
    for (const h of filled) {
        if (!h.key.trim() || !h.value)
            return "Every header needs both a name and a value.";
        if (h.key.length > HEADER_LIMITS.keyMaxLength)
            return `Header names must be ${HEADER_LIMITS.keyMaxLength} characters or fewer.`;
        if (h.value.length > HEADER_LIMITS.valueMaxLength)
            return `Header values must be ${HEADER_LIMITS.valueMaxLength} characters or fewer.`;
    }
    return null;
}
export function headersToRecord(rows) {
    const out = {};
    for (const r of rows) {
        const k = r.key.trim();
        if (k && r.value)
            out[k] = r.value;
    }
    return Object.keys(out).length > 0 ? out : undefined;
}
export function recordToHeaderRows(headers) {
    if (!headers)
        return [];
    return Object.entries(headers).map(([key, value], i) => ({
        id: `h-${i}-${key}`,
        key,
        value,
    }));
}
//# sourceMappingURL=validate.js.map