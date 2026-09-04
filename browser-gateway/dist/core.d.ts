/** Isomorphic aggregate — every export here is safe to import from Cloudflare Workers,
 *  Deno, Bun, or any runtime without Node.js `net`/`tls`/`ws`. Anything requiring the
 *  full Node.js gateway server (upgrade handler, http listener, CLI) is not exported
 *  here — those consumers should import from the package root `browser-gateway`. */
export * from "./core/types.js";
export * from "./core/auto-detect.js";
export * from "./core/selection.js";
export * from "./core/transport.js";
export * from "./core/webhooks.js";
export * from "./core/profile/types.js";
export * from "./core/profile/crypto.js";
export * from "./server/replay/types.js";
export * from "./core/cdp/protocol.js";
export * from "./core/providers/capabilities-with-client.js";
export { UNKNOWN_CAPABILITIES, type CapabilityState, type ProbeOptions, type ProviderCapabilities, } from "./core/providers/capabilities.js";
export { testConnectionWithClient, type TestConnectionClient, type TestConnectionResult, } from "./core/providers/test-connection.js";
export type { HelperPoolCdpClient } from "./core/profile/helper-pool-client.js";
export { injectStateEager, type EagerInjectOptions, type EagerInjectResult, } from "./core/profile/inject-eager.js";
export { captureFullStateOnClient, type CaptureFullOptions, type CaptureFullResult, } from "./core/profile/capture-full.js";
export { PROFILE_VERSION, PROFILE_ID_REGEX } from "./core/profile/index.js";
export { mergeAndPrepareProfile } from "./core/profile/save.js";
//# sourceMappingURL=core.d.ts.map