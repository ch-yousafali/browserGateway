import { z } from "zod";
import { PROFILE_VERSION } from "./types.js";
const SAME_SITE_VALUES = ["Strict", "Lax", "None"];
/** Matches Playwright's `context.addCookies` contract: only `name` and `value`
 *  are strictly required; either `url` OR (`domain` + `path`) must supply
 *  location. Everything else is optional. See playwright.dev docs. */
export const PlaywrightCookieSchema = z
    .object({
    name: z.string().min(1),
    value: z.string(),
    domain: z.string().optional(),
    path: z.string().optional(),
    url: z.string().url().optional(),
    expires: z.number().optional(),
    httpOnly: z.boolean().optional(),
    secure: z.boolean().optional(),
    sameSite: z.enum(SAME_SITE_VALUES).optional(),
})
    .refine((c) => Boolean(c.url) || (Boolean(c.domain) && Boolean(c.path)), { message: "cookie must include either `url` or both `domain` and `path`" });
export const PlaywrightOriginSchema = z.object({
    origin: z.string().url(),
    localStorage: z
        .array(z.object({ name: z.string(), value: z.string() }))
        .default([]),
});
export const PlaywrightStorageStateSchema = z.object({
    cookies: z.array(PlaywrightCookieSchema).default([]),
    origins: z.array(PlaywrightOriginSchema).default([]),
});
/**
 * Convert a captured profile to Playwright's `storageState` JSON shape.
 * Only fields Playwright understands are emitted. sessionStorage is dropped
 * (Playwright's `storageState` does not carry it — matches Playwright behaviour).
 * indexeddb + browserserve native files are dropped (Playwright cannot restore them).
 */
export function capturedProfileToStorageState(profile) {
    const cookies = profile.cookies.map(cdpCookieToPlaywright);
    const origins = [];
    for (const [origin, entries] of Object.entries(profile.storage)) {
        const localStorage = Object.entries(entries.localStorage ?? {}).map(([name, value]) => ({ name, value }));
        origins.push({ origin, localStorage });
    }
    return { cookies, origins };
}
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
export function storageStateToCapturedProfile(input) {
    const normalised = normalisePlaywrightInput(input);
    const parsed = PlaywrightStorageStateSchema.parse(normalised);
    const cookies = parsed.cookies.map(playwrightCookieToCdp);
    const storage = {};
    const capturedOrigins = [];
    for (const entry of parsed.origins) {
        const localStorage = {};
        for (const kv of entry.localStorage)
            localStorage[kv.name] = kv.value;
        storage[entry.origin] = { localStorage, sessionStorage: {} };
        capturedOrigins.push(entry.origin);
    }
    return {
        version: PROFILE_VERSION,
        capturedAt: new Date().toISOString(),
        cookies,
        storage,
        meta: {
            capturedOrigins,
            skippedOrigins: [],
            durationMs: 0,
        },
    };
}
function normalisePlaywrightInput(input) {
    if (Array.isArray(input)) {
        return { cookies: input.map(normaliseCookie), origins: [] };
    }
    if (input !== null && typeof input === "object") {
        const obj = input;
        const cookies = Array.isArray(obj.cookies) ? obj.cookies.map(normaliseCookie) : [];
        const origins = Array.isArray(obj.origins) ? obj.origins : [];
        return { cookies, origins };
    }
    return { cookies: [], origins: [] };
}
function normaliseCookie(raw) {
    if (raw === null || typeof raw !== "object")
        return raw;
    const c = raw;
    const out = { ...c };
    if (typeof out.expirationDate === "number" && out.expires === undefined) {
        out.expires = out.expirationDate;
        delete out.expirationDate;
    }
    if (typeof out.url === "string" && (!out.domain || !out.path)) {
        try {
            const u = new URL(out.url);
            if (!out.domain)
                out.domain = u.hostname;
            if (!out.path)
                out.path = u.pathname || "/";
        }
        catch { }
    }
    if (typeof out.sameSite === "string") {
        const s = out.sameSite.toLowerCase();
        if (s === "strict")
            out.sameSite = "Strict";
        else if (s === "lax")
            out.sameSite = "Lax";
        else if (s === "none" || s === "no_restriction")
            out.sameSite = "None";
        else if (s === "unspecified")
            delete out.sameSite;
    }
    return out;
}
function cdpCookieToPlaywright(cookie) {
    const out = {
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        expires: cookie.expires ?? -1,
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
    };
    if (cookie.sameSite)
        out.sameSite = cookie.sameSite;
    return out;
}
function playwrightCookieToCdp(cookie) {
    let domain = cookie.domain;
    let path = cookie.path;
    if (!domain || !path) {
        if (cookie.url) {
            try {
                const u = new URL(cookie.url);
                if (!domain)
                    domain = u.hostname;
                if (!path)
                    path = u.pathname || "/";
            }
            catch { }
        }
    }
    const out = {
        name: cookie.name,
        value: cookie.value,
        domain: domain ?? "",
        path: path ?? "/",
        httpOnly: cookie.httpOnly ?? false,
        secure: cookie.secure ?? false,
    };
    if (cookie.expires !== undefined && cookie.expires !== -1)
        out.expires = cookie.expires;
    out.sameSite = cookie.sameSite ?? "Lax";
    return out;
}
//# sourceMappingURL=playwright-format.js.map