import { Hono } from "hono";
import type { Logger } from "pino";
import type { Gateway } from "../core/index.js";
import type { SessionPool } from "../core/pool/index.js";
import type { ReplayStore } from "./replay/index.js";
import type { ReconnectRegistry } from "../core/proxy/reconnect.js";
import type { FilesystemProfileStore } from "./profile/filesystem-store.js";
import type { ProfileLifecycle } from "./profile/lifecycle.js";
export interface ProfileAppDeps {
    store: FilesystemProfileStore;
    dekByVersion: ReadonlyMap<number, Buffer>;
    lifecycle: ProfileLifecycle;
}
export declare function createApp(gateway: Gateway, token?: string, webDir?: string, logger?: Logger, pool?: SessionPool, profile?: ProfileAppDeps, profileBootstrapError?: string, replayStore?: ReplayStore, dataDir?: string, reconnectRegistry?: ReconnectRegistry): Hono<import("hono/types").BlankEnv, import("hono/types").BlankSchema, "/">;
//# sourceMappingURL=app.d.ts.map