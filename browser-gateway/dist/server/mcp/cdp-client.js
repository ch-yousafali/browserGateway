import WebSocket from "ws";
import { assertCdpConnected } from "../../core/profile/cdp-event-base.js";
const COMMAND_TIMEOUT_MS = 30000;
export class CdpClient {
    ws = null;
    nextId = 1;
    pending = new Map();
    eventHandlers = new Map();
    async connect(url, timeoutMs = 10000) {
        const targetUrl = await this.resolvePageTarget(url, timeoutMs);
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(targetUrl, { handshakeTimeout: timeoutMs });
            const timer = setTimeout(() => {
                ws.close();
                reject(new Error(`CDP connection timeout after ${timeoutMs}ms`));
            }, timeoutMs);
            ws.on("open", () => {
                clearTimeout(timer);
                this.ws = ws;
                this.setupMessageHandler();
                resolve();
            });
            ws.on("error", (err) => {
                clearTimeout(timer);
                reject(err);
            });
            ws.on("close", () => {
                clearTimeout(timer);
                reject(new Error("CDP connection closed before establishing"));
            });
        });
    }
    async resolvePageTarget(url, timeoutMs) {
        const parsed = new URL(url);
        if (parsed.pathname.includes("/devtools/page/")) {
            return url;
        }
        const httpBase = `http://${parsed.hostname}:${parsed.port}`;
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeoutMs);
            const resp = await fetch(`${httpBase}/json`, { signal: controller.signal });
            clearTimeout(timer);
            const targets = (await resp.json());
            const page = targets.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
            if (page?.webSocketDebuggerUrl) {
                return page.webSocketDebuggerUrl;
            }
        }
        catch { }
        return url;
    }
    setupMessageHandler() {
        this.ws.on("message", (data) => {
            let msg;
            try {
                msg = JSON.parse(data.toString());
            }
            catch {
                return;
            }
            if (msg.id !== undefined) {
                const pending = this.pending.get(msg.id);
                if (pending) {
                    this.pending.delete(msg.id);
                    clearTimeout(pending.timer);
                    if (msg.error) {
                        pending.reject(new Error(msg.error.message));
                    }
                    else {
                        pending.resolve(msg.result);
                    }
                }
            }
            else if (msg.method) {
                const handlers = this.eventHandlers.get(msg.method);
                if (handlers) {
                    for (const handler of [...handlers]) {
                        handler(msg.params);
                    }
                }
            }
        });
        this.ws.on("close", () => {
            for (const [, pending] of this.pending) {
                clearTimeout(pending.timer);
                pending.reject(new Error("CDP connection closed"));
            }
            this.pending.clear();
            this.ws = null;
        });
    }
    async send(method, params) {
        assertCdpConnected(this.ws);
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`CDP command timeout: ${method}`));
            }, COMMAND_TIMEOUT_MS);
            this.pending.set(id, { resolve, reject, timer });
            try {
                this.ws.send(JSON.stringify({ id, method, params }));
            }
            catch (err) {
                clearTimeout(timer);
                this.pending.delete(id);
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    }
    on(event, handler) {
        let handlers = this.eventHandlers.get(event);
        if (!handlers) {
            handlers = [];
            this.eventHandlers.set(event, handlers);
        }
        handlers.push(handler);
    }
    off(event, handler) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx !== -1)
                handlers.splice(idx, 1);
        }
    }
    once(event, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.off(event, handler);
                reject(new Error(`CDP event timeout: ${event}`));
            }, timeoutMs);
            const handler = (params) => {
                clearTimeout(timer);
                this.off(event, handler);
                resolve(params);
            };
            this.on(event, handler);
        });
    }
    async enableDomains() {
        await this.send("Page.enable");
        await this.send("Runtime.enable");
        await this.send("DOM.enable");
        try {
            await this.send("Accessibility.enable");
        }
        catch { }
    }
    async navigate(url) {
        const loadPromise = this.once("Page.loadEventFired", 15000).catch(() => { });
        const result = await this.send("Page.navigate", { url });
        if (result.errorText) {
            throw new Error(`Navigation failed: ${result.errorText}`);
        }
        await loadPromise;
        const evalUrl = await this.send("Runtime.evaluate", {
            expression: "document.URL",
            returnByValue: true,
        });
        const evalTitle = await this.send("Runtime.evaluate", {
            expression: "document.title",
            returnByValue: true,
        });
        return { url: evalUrl.result.value, title: evalTitle.result.value };
    }
    async screenshot(fullPage = false) {
        if (fullPage) {
            const metrics = await this.send("Page.getLayoutMetrics");
            await this.send("Emulation.setDeviceMetricsOverride", {
                width: Math.ceil(metrics.contentSize.width),
                height: Math.ceil(metrics.contentSize.height),
                deviceScaleFactor: 1,
                mobile: false,
            });
        }
        try {
            const result = await this.send("Page.captureScreenshot", {
                format: "png",
            });
            return result.data;
        }
        finally {
            if (fullPage) {
                await this.send("Emulation.clearDeviceMetricsOverride").catch(() => { });
            }
        }
    }
    async evaluate(expression, awaitPromise = true) {
        const hasAwait = /\bawait\s/.test(expression);
        const wrappedExpression = hasAwait
            ? `(async () => { ${expression} })()`
            : expression;
        const result = await this.send("Runtime.evaluate", {
            expression: wrappedExpression,
            returnByValue: true,
            awaitPromise,
        });
        if (result.exceptionDetails) {
            const desc = result.exceptionDetails.exception?.description ?? result.exceptionDetails.text;
            throw new Error(`JS Error: ${desc}`);
        }
        return result.result.value ?? result.result.description;
    }
    close() {
        this.eventHandlers.clear();
        for (const [, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(new Error("CDP connection closing"));
        }
        this.pending.clear();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
    get connected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
}
//# sourceMappingURL=cdp-client.js.map