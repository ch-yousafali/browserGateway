import type { Logger } from "pino";
import type { Gateway } from "../gateway.js";
interface WebhookConfig {
    url: string;
    events?: string[];
}
export declare class WebhookNotifier {
    private webhooks;
    private logger;
    constructor(webhooks: WebhookConfig[], logger: Logger);
    static fromGateway(gateway: Gateway, webhooks: WebhookConfig[], logger: Logger): WebhookNotifier;
    send(event: string, status: "firing" | "resolved", data: Record<string, unknown>): Promise<void>;
}
export {};
//# sourceMappingURL=webhooks.d.ts.map