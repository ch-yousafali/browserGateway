import { ContentRequestSchema } from "../../rest-schemas/index.js";
import { extractFormats } from "../../rest-schemas/helpers.js";
import { dispatchPageAction } from "./dispatch.js";
import { pageOptionsFromBody } from "./rest-helpers.js";
export async function handleContent(c, pool, gateway, logger, profileLifecycle) {
    const body = ContentRequestSchema.parse(await c.req.json());
    const result = await dispatchPageAction({ pool, gateway, logger, profileLifecycle }, body.profile, pageOptionsFromBody(body, c), async (page) => {
        const rawHtml = await page.content();
        const { content, metadata: defuddleMetadata } = await extractFormats(rawHtml, page.url(), () => page.evaluate("document.body.innerText"), body.formats);
        // If neither markdown nor readability was requested, fall back to a tiny
        // metadata snapshot pulled directly from the page.
        const metadata = defuddleMetadata
            ?? await page.evaluate(`({
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
          author: document.querySelector('meta[name="author"]')?.getAttribute("content") ?? "",
          language: document.documentElement.lang ?? "",
        })`);
        const links = await page.evaluate(`
        Array.from(document.querySelectorAll("a[href]"))
          .map(a => ({ url: a.href, text: (a.textContent || "").trim() }))
          .filter(l => l.url && l.text)
      `);
        return { content, metadata, links };
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
//# sourceMappingURL=content.js.map