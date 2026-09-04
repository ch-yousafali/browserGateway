import { z } from "zod";
import { type CapturedProfile } from "./types.js";
/** Matches Playwright's `context.addCookies` contract: only `name` and `value`
 *  are strictly required; either `url` OR (`domain` + `path`) must supply
 *  location. Everything else is optional. See playwright.dev docs. */
export declare const PlaywrightCookieSchema: z.ZodObject<{
    name: z.ZodString;
    value: z.ZodString;
    domain: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    expires: z.ZodOptional<z.ZodNumber>;
    httpOnly: z.ZodOptional<z.ZodBoolean>;
    secure: z.ZodOptional<z.ZodBoolean>;
    sameSite: z.ZodOptional<z.ZodEnum<{
        Strict: "Strict";
        Lax: "Lax";
        None: "None";
    }>>;
}, z.core.$strip>;
export declare const PlaywrightOriginSchema: z.ZodObject<{
    origin: z.ZodString;
    localStorage: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export declare const PlaywrightStorageStateSchema: z.ZodObject<{
    cookies: z.ZodDefault<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        value: z.ZodString;
        domain: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        expires: z.ZodOptional<z.ZodNumber>;
        httpOnly: z.ZodOptional<z.ZodBoolean>;
        secure: z.ZodOptional<z.ZodBoolean>;
        sameSite: z.ZodOptional<z.ZodEnum<{
            Strict: "Strict";
            Lax: "Lax";
            None: "None";
        }>>;
    }, z.core.$strip>>>;
    origins: z.ZodDefault<z.ZodArray<z.ZodObject<{
        origin: z.ZodString;
        localStorage: z.ZodDefault<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            value: z.ZodString;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type PlaywrightCookie = z.infer<typeof PlaywrightCookieSchema>;
export type PlaywrightOrigin = z.infer<typeof PlaywrightOriginSchema>;
export type PlaywrightStorageState = z.infer<typeof PlaywrightStorageStateSchema>;
/**
 * Convert a captured profile to Playwright's `storageState` JSON shape.
 * Only fields Playwright understands are emitted. sessionStorage is dropped
 * (Playwright's `storageState` does not carry it — matches Playwright behaviour).
 * indexeddb + browserserve native files are dropped (Playwright cannot restore them).
 */
export declare function capturedProfileToStorageState(profile: CapturedProfile): PlaywrightStorageState;
/**
 * Convert a Playwright-shaped JSON payload to a captured profile.
 *
 * Accepts three shapes so users can paste what their tool actually gave them:
 *   - Full Playwright storageState: `{ cookies: [...], origins: [...] }`
 *   - Cookies-only object:          `{ cookies: [...] }`         (no origins)
 *   - Bare cookie array:            `[{ name, value, ... }, ...]`
 *     (Puppeteer `page.cookies()`, Cookie-Editor, EditThisCookie exports)
 *
 * Cookies missing sameSite fall through to CDP default (Lax).
 * sessionStorage is initialised empty (Playwright does not carry it).
 * Throws z.ZodError when the input matches no accepted shape.
 */
export declare function storageStateToCapturedProfile(input: unknown): CapturedProfile;
//# sourceMappingURL=playwright-format.d.ts.map