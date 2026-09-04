/**
 * Server-side REST helpers. The Hono-tied bits live here; the pure content-
 * extraction helpers (Defuddle + linkedom) moved to
 * `src/rest-schemas/helpers.ts` so downstream isomorphic runtimes can reuse them.
 */
import type { Context } from "hono";
import type { PageOptions } from "./executor.js";
/**
 * Shape of the common base fields shared by every REST endpoint request body
 * (defined in `src/rest-schemas/index.ts` as `BaseFields`).
 *
 * Derived from {@link PageOptions} by stripping `signal` — the signal comes
 * from the Hono `Context`, not from the request body. Keeping these two types
 * tied via Omit ensures they stay in sync if PageOptions evolves.
 */
export type BaseRequestFields = Omit<PageOptions, "signal">;
/** Map a request body + Hono context to the executor's PageOptions shape. */
export declare function pageOptionsFromBody(body: BaseRequestFields, c: Context): PageOptions;
//# sourceMappingURL=rest-helpers.d.ts.map