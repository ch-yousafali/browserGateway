/**
 * Probe a WebSocket URL: resolves on `open` (then immediately closes), rejects
 * on `error` or timeout. Used by `POST /v1/providers/:id/test` and the CLI
 * `browser-gateway check` to verify reachability of a provider WS endpoint.
 */
export declare function probeWebSocket(url: string, timeoutMs?: number, headers?: Record<string, string>): Promise<void>;
//# sourceMappingURL=probe.d.ts.map