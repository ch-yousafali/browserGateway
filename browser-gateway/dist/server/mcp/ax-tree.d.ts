import type { CdpClient } from "./cdp-client.js";
export declare function clearRefs(): void;
export declare function getSnapshot(cdp: CdpClient): Promise<string>;
export declare function clickByRef(cdp: CdpClient, ref: number): Promise<{
    success: boolean;
    error?: string;
}>;
export declare function typeByRef(cdp: CdpClient, ref: number, text: string, clear?: boolean): Promise<{
    success: boolean;
    error?: string;
}>;
//# sourceMappingURL=ax-tree.d.ts.map