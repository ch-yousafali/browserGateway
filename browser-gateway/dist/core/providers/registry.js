import { probeProviderCapabilities, } from "./capabilities.js";
/** Bounded re-probe of a failed/warming provider: 2s, 4s, 8s, 16s, 32s. */
const MAX_REPROBE_ATTEMPTS = 5;
const REPROBE_BASE_MS = 2_000;
export class ProviderRegistry {
    providers = new Map();
    capabilities = new Map();
    inflightProbes = new Map();
    reprobeAttempts = new Map();
    register(id, config, opts = {}) {
        this.providers.set(id, {
            id,
            config,
            active: 0,
            healthy: true,
            cooldownUntil: null,
            failureCount: 0,
            successCount: 0,
            lastFailure: null,
            avgLatencyMs: 0,
            totalConnections: 0,
            detectedKind: null,
            discoveredMaxConcurrent: null,
        });
        this.capabilities.set(id, { status: "pending", capabilities: null });
        if (opts.autoProbe !== false) {
            void this.probe(id);
        }
    }
    /**
     * Run (or re-run) the capability probe for a provider. Idempotent — concurrent
     * calls return the same in-flight Promise.
     */
    probe(id) {
        const existing = this.inflightProbes.get(id);
        if (existing)
            return existing;
        const provider = this.providers.get(id);
        if (!provider)
            return Promise.resolve();
        this.capabilities.set(id, {
            status: "probing",
            capabilities: this.capabilities.get(id)?.capabilities ?? null,
        });
        const run = (async () => {
            try {
                const caps = await probeProviderCapabilities(provider.config.url);
                const allUnknown = caps.browserCookies === "unknown" &&
                    caps.targetCreate === "unknown" &&
                    caps.fetchInterception === "unknown";
                this.capabilities.set(id, {
                    status: allUnknown ? "failed" : "ready",
                    capabilities: caps,
                });
                provider.detectedKind = caps.providerKind === "browserserve" ? "browserserve" : null;
                provider.discoveredMaxConcurrent = caps.advertisedMaxConcurrent;
                if (allUnknown) {
                    this.scheduleReprobe(id);
                }
                else {
                    this.reprobeAttempts.delete(id);
                }
            }
            catch {
                this.capabilities.set(id, { status: "failed", capabilities: null });
                this.scheduleReprobe(id);
            }
            finally {
                this.inflightProbes.delete(id);
            }
        })();
        this.inflightProbes.set(id, run);
        return run;
    }
    /**
     * Re-runs a failed probe with exponential backoff, up to a bounded number of
     * attempts. A provider that is still warming (its `/json/version` returns 503)
     * probes as all-unknown; this lets it be detected once it is ready instead of
     * staying `detectedKind: null` forever.
     */
    scheduleReprobe(id) {
        const attempts = this.reprobeAttempts.get(id) ?? 0;
        if (attempts >= MAX_REPROBE_ATTEMPTS)
            return;
        this.reprobeAttempts.set(id, attempts + 1);
        const delayMs = REPROBE_BASE_MS * 2 ** attempts;
        const timer = setTimeout(() => {
            if (this.providers.has(id))
                void this.probe(id);
        }, delayMs);
        if (typeof timer.unref === "function")
            timer.unref();
    }
    /**
     * Awaits every provider's capability status to leave `pending`/`probing`,
     * or the deadline. Callers use this at boot to avoid the race where a
     * client connects for `?profile=X` before the capability probe has
     * classified the provider as browserserve, which would cause the first
     * request to 503 unless the provider is statically pinned. Bounded — also
     * awaits scheduled re-probes (used when the upstream was slow to start).
     */
    async awaitInitialProbes(opts = {}) {
        const deadline = Date.now() + (opts.maxWaitMs ?? 5_000);
        while (Date.now() < deadline) {
            const inflight = [...this.inflightProbes.values()];
            if (inflight.length > 0) {
                const remaining = Math.max(0, deadline - Date.now());
                await Promise.race([
                    Promise.allSettled(inflight),
                    new Promise((resolve) => setTimeout(resolve, remaining)),
                ]);
            }
            const anyProbing = [...this.providers.keys()].some((id) => {
                const status = this.capabilities.get(id)?.status;
                return status === "pending" || status === "probing";
            });
            if (!anyProbing && this.inflightProbes.size === 0)
                return;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }
    getCapabilityRecord(id) {
        return this.capabilities.get(id);
    }
    setCapabilities(id, capabilities) {
        this.capabilities.set(id, { status: "ready", capabilities });
    }
    get(id) {
        return this.providers.get(id);
    }
    getAll() {
        return [...this.providers.values()];
    }
    getAllSortedByPriority() {
        return this.getAll().sort((a, b) => a.config.priority - b.config.priority);
    }
    remove(id) {
        this.capabilities.delete(id);
        this.inflightProbes.delete(id);
        return this.providers.delete(id);
    }
    size() {
        return this.providers.size;
    }
}
//# sourceMappingURL=registry.js.map