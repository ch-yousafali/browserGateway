import { ScreenshotRequestSchema, RestApiError } from "../../rest-schemas/index.js";
import { scrollThroughPage } from "./executor.js";
import { dispatchPageAction } from "./dispatch.js";
import { pageOptionsFromBody } from "./rest-helpers.js";
export async function handleScreenshot(c, pool, gateway, logger, profileLifecycle) {
    const body = ScreenshotRequestSchema.parse(await c.req.json());
    const result = await dispatchPageAction({ pool, gateway, logger, profileLifecycle }, body.profile, pageOptionsFromBody(body, c), async (page) => {
        if (body.scrollPage) {
            await scrollThroughPage(page);
        }
        if (body.selector) {
            const element = await page.$(body.selector);
            if (!element) {
                throw new RestApiError(400, `Selector "${body.selector}" not found on page`);
            }
            return element.screenshot({
                type: body.format,
                quality: body.format === "jpeg" ? (body.quality ?? 80) : undefined,
                omitBackground: body.omitBackground,
            });
        }
        return page.screenshot({
            fullPage: body.fullPage,
            type: body.format,
            quality: body.format === "jpeg" ? (body.quality ?? 80) : undefined,
            clip: body.clip,
            omitBackground: body.omitBackground,
        });
    }, { tolerateGotoTimeout: true });
    return new Response(result.data, {
        status: 200,
        headers: {
            "Content-Type": `image/${body.format}`,
            "X-Response-Code": String(result.statusCode ?? ""),
            "X-Response-URL": result.resolvedUrl,
            "X-Timing-Total-Ms": String(result.timings.total),
            "X-Timing-Navigation-Ms": String(result.timings.navigation),
        },
    });
}
//# sourceMappingURL=screenshot.js.map