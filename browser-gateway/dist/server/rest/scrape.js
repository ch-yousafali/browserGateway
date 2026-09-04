import { ScrapeRequestSchema } from "../../rest-schemas/index.js";
import { extractFormats } from "../../rest-schemas/helpers.js";
import { dispatchPageAction } from "./dispatch.js";
import { pageOptionsFromBody } from "./rest-helpers.js";
export async function handleScrape(c, pool, gateway, logger, profileLifecycle) {
    const body = ScrapeRequestSchema.parse(await c.req.json());
    const result = await dispatchPageAction({ pool, gateway, logger, profileLifecycle }, body.profile, pageOptionsFromBody(body, c), async (page) => {
        const output = {};
        // Selector-based extraction
        if (body.selectors) {
            output.selectors = await page.evaluate(`(${JSON.stringify(body.selectors)}).map(({ name, selector, attribute }) => {
            const elements = document.querySelectorAll(selector);
            return {
              name,
              selector,
              results: Array.from(elements).map(el => ({
                text: (el.textContent || "").trim(),
                html: el.innerHTML,
                ...(attribute ? { attribute: el.getAttribute(attribute) || "" } : {}),
              })),
            };
          })`);
        }
        // Full-page content extraction
        if (body.formats) {
            const rawHtml = await page.content();
            const { content, metadata } = await extractFormats(rawHtml, page.url(), () => page.evaluate("document.body.innerText"), body.formats);
            output.content = content;
            if (metadata)
                output.metadata = metadata;
        }
        if (body.screenshot) {
            const buf = await page.screenshot({
                fullPage: false,
                type: "jpeg",
                quality: 80,
            });
            output.screenshot = buf.toString("base64");
        }
        return output;
    });
    return c.json({
        success: true,
        data: {
            url: result.resolvedUrl,
            statusCode: result.statusCode,
            ...result.data,
        },
        timings: result.timings,
    });
}
//# sourceMappingURL=scrape.js.map