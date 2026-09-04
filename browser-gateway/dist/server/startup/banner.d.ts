/**
 * Startup banner for `browser-gateway serve`.
 *
 * DX inspiration: Vite (clean URL list) + Next.js (▲ + "ready in Xms" timing)
 * + Wrangler (structured feature rows). The goal is a banner that's scannable
 * in 2 seconds, prints once on startup, and uses ANSI colors when the terminal
 * supports them (TTY). Non-TTY output falls back to plain text so log files
 * and CI runs stay readable.
 *
 * Banner content is intentionally separate from `pino` structured logs —
 * those continue as JSON for log aggregators while the human-readable banner
 * goes straight to stdout.
 */
import type { GatewayConfig, ProviderState } from "../../core/types.js";
export interface BannerOptions {
    version: string;
    port: number;
    /** Whether the dashboard is being served. */
    hasDashboard: boolean;
    /** Whether BG_TOKEN is set. */
    authEnabled: boolean;
    /** Profiles status — affects which line we print. */
    profilesStatus: "enabled" | "disabled";
    /** Compute health summary from gateway.registry. */
    providers: ProviderState[];
    /** Wall-clock milliseconds from process start. */
    readyMs: number;
    config: GatewayConfig;
}
export declare function printStartupBanner(opts: BannerOptions): void;
//# sourceMappingURL=banner.d.ts.map