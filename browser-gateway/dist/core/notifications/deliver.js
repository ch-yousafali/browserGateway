/** Pure webhook delivery with retry. Isomorphic — Node, Cloudflare Workers, Bun, Deno. */
const DEFAULT_RETRY_DELAYS = [1000, 5000, 15000];
const DEFAULT_TIMEOUT_MS = 5000;
export async function deliverWebhook(url, payload, opts = {}) {
    const retryDelays = opts.retryDelays ?? DEFAULT_RETRY_DELAYS;
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    let attempt = 0;
    for (;;) {
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            opts.onSuccess?.(attempt);
            return { delivered: true, attempts: attempt + 1 };
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            opts.onAttemptFailed?.(attempt, error);
            if (attempt >= retryDelays.length) {
                opts.onFailure?.(error);
                return { delivered: false, attempts: attempt + 1 };
            }
            await new Promise((r) => setTimeout(r, retryDelays[attempt]));
            attempt++;
        }
    }
}
//# sourceMappingURL=deliver.js.map