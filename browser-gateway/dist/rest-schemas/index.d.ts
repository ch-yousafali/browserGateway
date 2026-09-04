/** Isomorphic Zod schemas + error class for the REST API surface
 *  (`/v1/screenshot`, `/v1/content`, `/v1/scrape`). Consumed by both the OSS
 *  server (`src/server/rest/*`) and any downstream runtime that speaks the
 *  same request shape (Cloudflare Workers etc.). No `node:` imports. */
import { z } from "zod";
export declare const ScreenshotRequestSchema: z.ZodObject<{
    fullPage: z.ZodDefault<z.ZodBoolean>;
    format: z.ZodDefault<z.ZodEnum<{
        png: "png";
        jpeg: "jpeg";
    }>>;
    quality: z.ZodOptional<z.ZodNumber>;
    selector: z.ZodOptional<z.ZodString>;
    clip: z.ZodOptional<z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, z.core.$strip>>;
    omitBackground: z.ZodDefault<z.ZodBoolean>;
    scrollPage: z.ZodDefault<z.ZodBoolean>;
    waitUntil: z.ZodDefault<z.ZodEnum<{
        load: "load";
        domcontentloaded: "domcontentloaded";
        networkidle: "networkidle";
        commit: "commit";
    }>>;
    url: z.ZodString;
    viewport: z.ZodOptional<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    waitForSelector: z.ZodOptional<z.ZodString>;
    waitForTimeout: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    userAgent: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/** Request body for `POST /v1/screenshot`. Inferred from {@link ScreenshotRequestSchema}. @public */
export type ScreenshotRequest = z.infer<typeof ScreenshotRequestSchema>;
export declare const ContentRequestSchema: z.ZodObject<{
    formats: z.ZodDefault<z.ZodArray<z.ZodEnum<{
        text: "text";
        markdown: "markdown";
        html: "html";
        readability: "readability";
    }>>>;
    waitUntil: z.ZodDefault<z.ZodEnum<{
        load: "load";
        domcontentloaded: "domcontentloaded";
        networkidle: "networkidle";
        commit: "commit";
    }>>;
    url: z.ZodString;
    viewport: z.ZodOptional<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    waitForSelector: z.ZodOptional<z.ZodString>;
    waitForTimeout: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    userAgent: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/** Request body for `POST /v1/content`. Inferred from {@link ContentRequestSchema}. @public */
export type ContentRequest = z.infer<typeof ContentRequestSchema>;
export declare const ScrapeRequestSchema: z.ZodObject<{
    selectors: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        selector: z.ZodString;
        attribute: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    formats: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        text: "text";
        markdown: "markdown";
        html: "html";
        readability: "readability";
    }>>>;
    screenshot: z.ZodDefault<z.ZodBoolean>;
    waitUntil: z.ZodDefault<z.ZodEnum<{
        load: "load";
        domcontentloaded: "domcontentloaded";
        networkidle: "networkidle";
        commit: "commit";
    }>>;
    url: z.ZodString;
    viewport: z.ZodOptional<z.ZodObject<{
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    waitForSelector: z.ZodOptional<z.ZodString>;
    waitForTimeout: z.ZodOptional<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retries: z.ZodDefault<z.ZodNumber>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    userAgent: z.ZodOptional<z.ZodString>;
    profile: z.ZodOptional<z.ZodString>;
    provider: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
/** Request body for `POST /v1/scrape`. Inferred from {@link ScrapeRequestSchema}. @public */
export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
/** Structured error thrown by REST handlers. Server layer maps `.status` to HTTP. */
export declare class RestApiError extends Error {
    status: number;
    constructor(status: number, message: string);
}
//# sourceMappingURL=index.d.ts.map