import type { GatewayConfig } from "../../core/types.js";
export interface ProfilesSetupInput {
    configPath: string;
    config?: GatewayConfig;
}
export interface ProfilesSetupResult {
    configPath: string;
    configWritten: boolean;
    configAlreadyHadBlock: boolean;
    restartRequired: boolean;
}
export declare function enableProfilesFlow(input: ProfilesSetupInput): ProfilesSetupResult;
export declare function disableProfilesFlow(input: ProfilesSetupInput): ProfilesSetupResult;
//# sourceMappingURL=profiles-setup.d.ts.map