import { deliverWebhook } from "./deliver.js";
export class WebhookNotifier {
    webhooks;
    logger;
    constructor(webhooks, logger) {
        this.webhooks = webhooks;
        this.logger = logger;
    }
    static fromGateway(gateway, webhooks, logger) {
        const notifier = new WebhookNotifier(webhooks, logger);
        gateway.on("provider.cooldown", (data) => {
            notifier.send("provider.cooldown", "firing", data);
        });
        gateway.on("provider.down", (data) => {
            notifier.send("provider.down", "firing", data);
        });
        gateway.on("provider.up", (data) => {
            notifier.send("provider.up", "resolved", data);
        });
        gateway.on("shutdown.start", () => {
            notifier.send("shutdown.start", "firing", {});
        });
        gateway.on("queue.timeout", (data) => {
            notifier.send("queue.timeout", "firing", data);
        });
        return notifier;
    }
    async send(event, status, data) {
        const payload = {
            version: "1",
            timestamp: new Date().toISOString(),
            event,
            status,
            source: "browser-gateway",
            data,
        };
        for (const webhook of this.webhooks) {
            if (webhook.events && !webhook.events.includes(event))
                continue;
            deliverWebhook(webhook.url, payload, {
                onSuccess: () => {
                    this.logger.debug({ url: webhook.url.slice(0, 50), event }, "webhook delivered");
                },
                onAttemptFailed: (attempt, err) => {
                    this.logger.debug({ url: webhook.url.slice(0, 50), attempt: attempt + 1, error: err.message }, "webhook retry");
                },
                onFailure: (err) => {
                    this.logger.warn({ url: webhook.url.slice(0, 50), event, error: err.message }, "webhook delivery failed after retries");
                },
            }).catch(() => { });
        }
    }
}
//# sourceMappingURL=webhooks.js.map