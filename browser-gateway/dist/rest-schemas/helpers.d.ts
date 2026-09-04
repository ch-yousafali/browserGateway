/** Isomorphic content-extraction helpers shared by the REST handlers (server +
 *  any downstream runtime). `defuddle` and `linkedom` are Workers-compatible
 *  (both verified 2026-09-01 via source-code audit — zero `node:` imports in
 *  the paths this module uses). */
/**
 * Parse HTML with linkedom and extract content with Defuddle. Dynamic-imports
 * both libraries because they are heavy (linkedom alone is ~1MB) and not always
 * needed for every REST request.
 */
export declare function extractWithDefuddle(rawHtml: string, pageUrl: string, markdown: boolean): Promise<import("defuddle/node").DefuddleResponse>;
/** Extract the standard set of metadata fields from a Defuddle result. */
export declare function metadataFromDefuddle(result: Awaited<ReturnType<typeof extractWithDefuddle>>): Record<string, unknown>;
/**
 * Run the standard format-extraction matrix used by `/v1/content` and
 * `/v1/scrape`. Given a raw HTML string + page URL + a way to fetch the page's
 * innerText + a list of requested formats, returns the filled-in `content` map
 * and optional `metadata` object.
 */
export declare function extractFormats(rawHtml: string, pageUrl: string, innerText: () => Promise<string>, formats: ReadonlyArray<"html" | "text" | "markdown" | "readability">): Promise<{
    content: Record<string, string>;
    metadata: Record<string, unknown> | undefined;
}>;
//# sourceMappingURL=helpers.d.ts.map