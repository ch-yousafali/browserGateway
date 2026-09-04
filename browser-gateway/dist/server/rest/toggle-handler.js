import { resolve } from "node:path";
import { loadedConfigPath } from "../config/loader.js";
export function makeToggleHandler(getConfig, flow, missingConfigError, failureLabel) {
    return async (c) => {
        const config = getConfig();
        if (!config) {
            return c.json({ error: missingConfigError }, 400);
        }
        try {
            const result = flow({
                configPath: loadedConfigPath ?? resolve(process.cwd(), "gateway.yml"),
                config,
            });
            return c.json(result);
        }
        catch (err) {
            return c.json({ error: err instanceof Error ? err.message : failureLabel }, 400);
        }
    };
}
//# sourceMappingURL=toggle-handler.js.map