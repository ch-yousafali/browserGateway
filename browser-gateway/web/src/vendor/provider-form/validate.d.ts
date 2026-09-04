import { type HeaderRow } from "./types.js";
export declare function slugifyProviderName(input: string): string;
export declare function isValidProviderUrl(value: string): boolean;
export declare function validateProviderSlug(slug: string): string | null;
export declare function validateProviderUrl(url: string): string | null;
export declare function validatePositiveInteger(value: string, fieldLabel: string): string | null;
export declare function validateHeaderRows(rows: HeaderRow[]): string | null;
export declare function headersToRecord(rows: HeaderRow[]): Record<string, string> | undefined;
export declare function recordToHeaderRows(headers: Record<string, string> | null | undefined): HeaderRow[];
//# sourceMappingURL=validate.d.ts.map