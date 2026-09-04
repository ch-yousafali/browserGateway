/** Pure webhook delivery with retry. Isomorphic — Node, Cloudflare Workers, Bun, Deno. */
export interface WebhookPayload {
    version: string;
    timestamp: string;
    event: string;
    status: "firing" | "resolved";
    source: string;
    data: Record<string, unknown>;
}
export interface WebhookDeliverOptions {
    /** Millisecond retry delays. Defaults to [1000, 5000, 15000]. */
    retryDelays?: readonly number[];
    /** Per-request timeout in ms. Defaults to 5000. */
    timeoutMs?: number;
    /** Called once when delivery succeeds. Attempt is 0-indexed. */
    onSuccess?: (attempt: number) => void;
    /** Called each time an attempt fails (before retry). */
    onAttemptFailed?: (attempt: number, err: Error) => void;
    /** Called once when all retries are exhausted. */
    onFailure?: (finalErr: Error) => void;
}
export interface WebhookDeliverResult {
    delivered: boolean;
    attempts: number;
}
export declare function deliverWebhook(url: string, payload: WebhookPayload, opts?: WebhookDeliverOptions): Promise<WebhookDeliverResult>;
//# sourceMappingURL=deliver.d.ts.map