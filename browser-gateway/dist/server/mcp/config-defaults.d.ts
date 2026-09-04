/**
 * Default GatewayConfig builder for the MCP "stdio" / "zero-config" code paths
 * in `index.ts` and `local-chrome.ts`.
 *
 * Both files construct a GatewayConfig with the same defaults — only the
 * `providers` field differs. Extracting that here keeps the defaults in one
 * place so they can't drift.
 */
import { type GatewayConfig, type ProviderConfig } from "../../core/types.js";
export declare function buildMcpGatewayConfig(port: number, providers: Record<string, ProviderConfig>): GatewayConfig;
//# sourceMappingURL=config-defaults.d.ts.map