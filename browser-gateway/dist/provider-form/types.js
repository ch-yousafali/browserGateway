/** Shared provider-form types + constants consumed by both OSS and SaaS dashboards. */
export const HEADER_LIMITS = {
    maxHeaders: 20,
    keyMaxLength: 80,
    valueMaxLength: 4096,
};
export const PROVIDER_LIMITS = {
    slugMinLength: 1,
    slugMaxLength: 64,
    slugPattern: /^[a-z0-9-]+$/,
};
export const DEFAULT_PRIORITY = 100;
export const DEFAULT_WEIGHT = 100;
//# sourceMappingURL=types.js.map