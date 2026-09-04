import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Gateway } from "../../core/index.js";
import type { Logger } from "pino";
import { McpSessionManager } from "./sessions.js";
export declare function createSessionManager(gateway: Gateway, logger: Logger): McpSessionManager;
export declare function createMcpServer(gateway: Gateway, logger: Logger, sessionManager?: McpSessionManager): {
    mcpServer: McpServer;
    sessionManager: McpSessionManager;
};
//# sourceMappingURL=server.d.ts.map