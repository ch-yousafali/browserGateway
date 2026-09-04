import { platform } from "node:os";
import { buildMcpGatewayConfig } from "./config-defaults.js";
// Match playwright-mcp's detection: headed on macOS/Windows, headless on Linux without DISPLAY
function shouldDefaultHeadless() {
    return platform() === "linux" && !process.env.DISPLAY;
}
let instance = null;
export async function setupLocalChrome(stderrLog, options) {
    const log = stderrLog ?? ((msg) => process.stderr.write(msg + "\n"));
    let chromeLauncher;
    try {
        chromeLauncher = await import("chrome-launcher");
    }
    catch {
        log("chrome-launcher not available. Install it: npm install chrome-launcher");
        process.exit(1);
    }
    log("No config file found - starting in zero-config local mode");
    log("Detecting Chrome...");
    let chrome;
    try {
        const needsHeadless = options?.headless ?? shouldDefaultHeadless();
        const chromeFlags = [
            "--disable-dev-shm-usage",
        ];
        if (needsHeadless) {
            chromeFlags.unshift("--headless=new");
            log("Running in headless mode");
        }
        else {
            log("Running in headed mode (use --headless to disable)");
        }
        chrome = await chromeLauncher.launch({ chromeFlags });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log(`Chrome not found: ${msg}`);
        log("");
        log("To use zero-config mode, install Google Chrome.");
        log("Or create a gateway.yml with remote providers:");
        log("  browser-gateway mcp --config gateway.yml");
        process.exit(1);
    }
    log(`Chrome launched on port ${chrome.port}`);
    const versionResp = await fetch(`http://localhost:${chrome.port}/json/version`);
    const versionData = (await versionResp.json());
    const cdpUrl = versionData.webSocketDebuggerUrl;
    log(`CDP endpoint: ${cdpUrl}`);
    instance = {
        port: chrome.port,
        cdpUrl,
        kill: async () => {
            await chrome.kill();
        },
    };
    process.on("exit", () => {
        try {
            chrome.kill();
        }
        catch { }
    });
    let gatewayPort = parseInt(process.env.PORT ?? "9500", 10);
    if (Number.isNaN(gatewayPort) || gatewayPort < 1 || gatewayPort > 65535) {
        gatewayPort = 9500;
    }
    return buildMcpGatewayConfig(gatewayPort, {
        "local-chrome": {
            url: cdpUrl,
            limits: { maxConcurrent: 5 },
            priority: 1,
            weight: 1,
            multiProfile: false,
        },
    });
}
export async function killLocalChrome() {
    if (instance) {
        await instance.kill();
        instance = null;
    }
}
//# sourceMappingURL=local-chrome.js.map