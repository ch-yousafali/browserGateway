/** Isomorphic provider-connection probe. Callers supply a pre-connected CDP client;
 *  the helper runs one `Browser.getVersion` call and reports latency + success.
 *  Node callers typically pair this with `WsCDPClient` from the main package;
 *  Workers/Deno/Bun callers pair it with `CdpProtocolClient` and their own transport. */
export interface TestConnectionClient {
    sendOn(method: string, params: Record<string, unknown> | undefined, sessionId: string | undefined): Promise<unknown>;
    close(): Promise<void>;
}
export interface TestConnectionResult {
    ok: boolean;
    latencyMs: number;
    reason?: string;
}
/** Runs one CDP command (`Browser.getVersion`) against an already-connected client.
 *  Reports latency and success. Never throws — surfaces errors as `ok: false`. */
export declare function testConnectionWithClient(client: TestConnectionClient, timeoutMs?: number): Promise<TestConnectionResult>;
//# sourceMappingURL=test-connection.d.ts.map