export declare class CdpClient {
    private ws;
    private nextId;
    private pending;
    private eventHandlers;
    connect(url: string, timeoutMs?: number): Promise<void>;
    private resolvePageTarget;
    private setupMessageHandler;
    send(method: string, params?: Record<string, unknown>): Promise<unknown>;
    on(event: string, handler: (params: unknown) => void): void;
    off(event: string, handler: (params: unknown) => void): void;
    once(event: string, timeoutMs?: number): Promise<unknown>;
    enableDomains(): Promise<void>;
    navigate(url: string): Promise<{
        url: string;
        title: string;
    }>;
    screenshot(fullPage?: boolean): Promise<string>;
    evaluate(expression: string, awaitPromise?: boolean): Promise<unknown>;
    close(): void;
    get connected(): boolean;
}
//# sourceMappingURL=cdp-client.d.ts.map