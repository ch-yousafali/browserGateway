import type { ProviderConfig, ProviderState } from "../types.js";
import { type ProviderCapabilities } from "./capabilities.js";
/**
 * Read-only view of provider state that the selector needs. Any store —
 * the built-in in-memory ProviderRegistry, or an adapter over an external
 * store (D1, KV, Postgres) — can satisfy this by producing hydrated
 * ProviderState objects.
 */
export interface ProviderStore {
    get(id: string): ProviderState | undefined;
    getAllSortedByPriority(): ProviderState[];
}
export type CapabilityProbeStatus = "pending" | "probing" | "ready" | "failed";
export interface CapabilityRecord {
    status: CapabilityProbeStatus;
    capabilities: ProviderCapabilities | null;
}
export interface RegisterOptions {
    /** Run the capability probe after register. Default true. */
    autoProbe?: boolean;
}
export declare class ProviderRegistry implements ProviderStore {
    private providers;
    private capabilities;
    private inflightProbes;
    private reprobeAttempts;
    register(id: string, config: ProviderConfig, opts?: RegisterOptions): void;
    /**
     * Run (or re-run) the capability probe for a provider. Idempotent — concurrent
     * calls return the same in-flight Promise.
     */
    probe(id: string): Promise<void>;
    /**
     * Re-runs a failed probe with exponential backoff, up to a bounded number of
     * attempts. A provider that is still warming (its `/json/version` returns 503)
     * probes as all-unknown; this lets it be detected once it is ready instead of
     * staying `detectedKind: null` forever.
     */
    private scheduleReprobe;
    /**
     * Awaits every provider's capability status to leave `pending`/`probing`,
     * or the deadline. Callers use this at boot to avoid the race where a
     * client connects for `?profile=X` before the capability probe has
     * classified the provider as browserserve, which would cause the first
     * request to 503 unless the provider is statically pinned. Bounded — also
     * awaits scheduled re-probes (used when the upstream was slow to start).
     */
    awaitInitialProbes(opts?: {
        maxWaitMs?: number;
    }): Promise<void>;
    getCapabilityRecord(id: string): CapabilityRecord | undefined;
    setCapabilities(id: string, capabilities: import("./capabilities.js").ProviderCapabilities): void;
    get(id: string): ProviderState | undefined;
    getAll(): ProviderState[];
    getAllSortedByPriority(): ProviderState[];
    remove(id: string): boolean;
    size(): number;
}
//# sourceMappingURL=registry.d.ts.map