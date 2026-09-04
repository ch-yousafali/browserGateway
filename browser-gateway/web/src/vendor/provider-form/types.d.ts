/** Shared provider-form types + constants consumed by both OSS and SaaS dashboards. */
export interface HeaderRow {
    id: string;
    key: string;
    value: string;
}
export interface ProviderShape {
    slug: string;
    url: string;
    priority?: number;
    weight?: number;
    maxConcurrent?: number;
    profile?: string;
    headers?: Record<string, string>;
}
export interface ProfileSummary {
    slug: string;
}
export interface SiblingProvider {
    slug: string;
    priority: number;
    weight: number;
}
export declare const HEADER_LIMITS: {
    readonly maxHeaders: 20;
    readonly keyMaxLength: 80;
    readonly valueMaxLength: 4096;
};
export declare const PROVIDER_LIMITS: {
    readonly slugMinLength: 1;
    readonly slugMaxLength: 64;
    readonly slugPattern: RegExp;
};
export declare const DEFAULT_PRIORITY = 100;
export declare const DEFAULT_WEIGHT = 100;
//# sourceMappingURL=types.d.ts.map