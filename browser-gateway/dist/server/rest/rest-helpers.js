/** Map a request body + Hono context to the executor's PageOptions shape. */
export function pageOptionsFromBody(body, c) {
    return {
        url: body.url,
        viewport: body.viewport,
        waitUntil: body.waitUntil,
        waitForSelector: body.waitForSelector,
        waitForTimeout: body.waitForTimeout,
        timeout: body.timeout,
        headers: body.headers,
        userAgent: body.userAgent,
        retries: body.retries,
        provider: body.provider,
        signal: c.req.raw.signal,
    };
}
//# sourceMappingURL=rest-helpers.js.map