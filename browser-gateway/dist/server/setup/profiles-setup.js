import { openSync, readFileSync, writeSync, fsyncSync, closeSync, existsSync } from "node:fs";
import { writeConfig } from "../config/writer.js";
const PROFILES_BLOCK = `
profiles:
  enabled: true
  filesystem:
    path: ./profiles
  encryption:
    keyEnv: BG_ENCRYPTION_KEY
`;
function writeDurably(path, contents) {
    const fd = openSync(path, "w");
    try {
        writeSync(fd, contents);
        fsyncSync(fd);
    }
    finally {
        closeSync(fd);
    }
}
export function enableProfilesFlow(input) {
    const { configPath, config } = input;
    let configWritten = false;
    let configAlreadyHadBlock = false;
    if (config && existsSync(configPath)) {
        if (config.profiles.enabled) {
            configAlreadyHadBlock = true;
        }
        else {
            config.profiles.enabled = true;
            writeConfig(config, configPath);
            configWritten = true;
        }
        return { configPath, configWritten, configAlreadyHadBlock, restartRequired: configWritten };
    }
    try {
        if (existsSync(configPath)) {
            const yamlText = readFileSync(configPath, "utf-8");
            if (/^profiles:/m.test(yamlText)) {
                configAlreadyHadBlock = true;
            }
            else {
                const sep = yamlText.length === 0 || yamlText.endsWith("\n") ? "" : "\n";
                writeDurably(configPath, yamlText + sep + PROFILES_BLOCK);
                configWritten = true;
            }
        }
        else {
            writeDurably(configPath, PROFILES_BLOCK.trimStart());
            configWritten = true;
        }
    }
    catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        throw new Error(`Cannot write gateway.yml at ${configPath}: ${reason}. Set BG_DATA_DIR to a writable path or mount gateway.yml with write permission.`, { cause: err });
    }
    if (config && configWritten) {
        config.profiles.enabled = true;
    }
    return { configPath, configWritten, configAlreadyHadBlock, restartRequired: configWritten };
}
export function disableProfilesFlow(input) {
    const { configPath, config } = input;
    if (!config) {
        throw new Error("Cannot disable profiles without an in-memory config");
    }
    if (!config.profiles.enabled) {
        return { configPath, configWritten: false, configAlreadyHadBlock: true, restartRequired: false };
    }
    config.profiles.enabled = false;
    writeConfig(config, configPath);
    return { configPath, configWritten: true, configAlreadyHadBlock: true, restartRequired: true };
}
//# sourceMappingURL=profiles-setup.js.map