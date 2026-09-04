import type { GatewayConfig } from "../../core/types.js";
export declare function setupLocalChrome(stderrLog?: (msg: string) => void, options?: {
    headless?: boolean;
}): Promise<GatewayConfig>;
export declare function killLocalChrome(): Promise<void>;
//# sourceMappingURL=local-chrome.d.ts.map