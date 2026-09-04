export async function runPageAction(page, options, action, runOpts = {}) {
    if (options.viewport)
        await page.setViewportSize(options.viewport);
    if (options.headers)
        await page.setExtraHTTPHeaders(options.headers);
    const navStart = Date.now();
    let response = null;
    try {
        response = await page.goto(options.url, {
            waitUntil: options.waitUntil ?? "load",
            timeout: options.timeout ?? 30000,
        });
    }
    catch (err) {
        if (!runOpts.tolerateGotoTimeout || !(err instanceof Error) || !/Timeout/.test(err.message)) {
            throw err;
        }
    }
    const navigationMs = Date.now() - navStart;
    if (options.waitForSelector) {
        await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }
    if (options.waitForTimeout) {
        await page.waitForTimeout(options.waitForTimeout);
    }
    const actionStart = Date.now();
    const data = await action(page);
    const actionMs = Date.now() - actionStart;
    return {
        data,
        statusCode: response?.status() ?? null,
        resolvedUrl: page.url(),
        navigationMs,
        actionMs,
    };
}
//# sourceMappingURL=page-runner.js.map