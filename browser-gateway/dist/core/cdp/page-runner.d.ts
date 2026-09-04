/**
 * Isomorphic page-runner — Playwright's page.* high-level API rewritten as
 * raw CDP commands on top of `CdpProtocolClient`. Runs anywhere the CDP client
 * runs (Node, Cloudflare Workers, browser).
 *
 * Contract: caller opens a CDP connection + attaches to a page target,
 * hands us the sessionId. We do NOT manage target lifecycle (create/close).
 * That's the caller's job so cleanup is explicit at the call site.
 *
 * Screenshot capture must always run Emulation.setDeviceMetricsOverride BEFORE
 * Page.captureScreenshot — same Chromium quirk as Page.startScreencast
 * (puppeteer/puppeteer#10527). runPageAction() handles this via the viewport
 * setup step.
 */
import type { CdpProtocolClient } from "./protocol.js";
/** Options that shape the pre-action page setup + navigation.
 *  Mirrors the OSS REST schema BaseFields (browser-gateway/rest-schemas). */
export interface PageOptions {
    url: string;
    viewport?: {
        width: number;
        height: number;
    };
    headers?: Record<string, string>;
    userAgent?: string;
    /** Navigation wait strategy. `load` = load event fired,
     *  `domcontentloaded` = DOMContentLoaded fired,
     *  `commit` = navigation committed (fastest),
     *  `networkidle` = ≥500ms with 0 in-flight requests (slowest, most reliable). */
    waitUntil?: "load" | "domcontentloaded" | "networkidle" | "commit";
    waitForSelector?: string;
    waitForTimeout?: number;
    /** Nav timeout in ms. Default 30_000. */
    timeout?: number;
    /** Client-disconnect signal. When aborted, runPageAction throws an AbortError
     *  before / between CDP calls so a disconnected caller doesn't keep the browser busy. */
    signal?: AbortSignal;
}
/** Thrown when {@link PageOptions.signal} aborts mid-run. Server callers should
 *  map `error.name === "AbortError"` to HTTP 499 (matches OSS REST behaviour). */
export declare class AbortError extends Error {
    name: string;
    constructor(message?: string);
}
/** Result payload from runPageAction. */
export interface PageRunResult<T> {
    data: T;
    statusCode: number | null;
    resolvedUrl: string;
    navigationMs: number;
    actionMs: number;
}
/** Screenshot capture options passed to Page.captureScreenshot. */
export interface ScreenshotOpts {
    format?: "png" | "jpeg" | "webp";
    quality?: number;
    clip?: {
        x: number;
        y: number;
        width: number;
        height: number;
        scale?: number;
    };
    captureBeyondViewport?: boolean;
    fromSurface?: boolean;
    omitBackground?: boolean;
}
/**
 * Run a user action against a page. Handles viewport/header/UA setup,
 * navigation, wait strategies, then invokes the action. Throws on any CDP
 * failure or navigation-timeout (unless `tolerateGotoTimeout` is set — see
 * OSS screenshot handler for why: some slow pages produce useful screenshots
 * even without full navigation completion).
 */
export declare function runPageAction<T>(cdp: CdpProtocolClient, sessionId: string, options: PageOptions, action: (cdp: CdpProtocolClient, sessionId: string) => Promise<T>, runOpts?: {
    tolerateGotoTimeout?: boolean;
}): Promise<PageRunResult<T>>;
/**
 * Capture a full-viewport or clipped screenshot as a Uint8Array of image bytes.
 * `format` defaults to "png"; `quality` only applies to jpeg/webp.
 * `captureBeyondViewport` corresponds to Playwright's `fullPage: true`.
 */
export declare function captureScreenshot(cdp: CdpProtocolClient, sessionId: string, opts?: ScreenshotOpts): Promise<Uint8Array>;
/**
 * Return the outer HTML of the current document. Equivalent to Playwright's
 * page.content() modulo doctype which Playwright synthesizes; here we return
 * exactly what Chromium serializes.
 */
export declare function capturePageHTML(cdp: CdpProtocolClient, sessionId: string): Promise<string>;
/** Options for {@link evaluateInPage}. Defaults mirror Playwright's `page.evaluate`
 *  (returnByValue: true, awaitPromise: true). Callers with a known-sync expression
 *  can pass `awaitPromise: false` for a tiny latency win. */
export interface EvaluateOpts {
    awaitPromise?: boolean;
    returnByValue?: boolean;
}
/**
 * Run an arbitrary JS expression in the page context and return its value.
 * Throws on runtime exception or unexpected result shape. Value must be
 * JSON-serializable when `returnByValue` is true (the default).
 */
export declare function evaluateInPage<T>(cdp: CdpProtocolClient, sessionId: string, expression: string, opts?: EvaluateOpts): Promise<T>;
/**
 * Capture a screenshot clipped to a CSS-selector-scoped element. Returns 0-byte
 * safe error via thrown Error when the selector doesn't match — the server layer
 * maps that to HTTP 400 (OSS behaviour parity).
 *
 * Uses `getBoundingClientRect` via {@link evaluateInPage} rather than
 * `DOM.getBoxModel` so we don't need to enable the DOM domain and don't pay the
 * cost of a full DOM node tree walk.
 */
export declare function captureElementScreenshot(cdp: CdpProtocolClient, sessionId: string, selector: string, opts?: ScreenshotOpts): Promise<Uint8Array>;
/**
 * Scroll from top to bottom in half-viewport steps to trigger lazy-loaded content,
 * then return to the top. Matches the OSS `scrollThroughPage` shape verbatim so
 * the two runtimes produce identical scroll behaviour before capture.
 *
 * Runs the whole scroll as a single `Runtime.evaluate` call so the driver-side
 * cost is one CDP round-trip regardless of page height.
 */
export declare function scrollThroughPage(cdp: CdpProtocolClient, sessionId: string): Promise<void>;
//# sourceMappingURL=page-runner.d.ts.map