/**
 * Resolve `BG_DATA_DIR` to an absolute path. Chain (highest precedence first):
 *
 *   1. `BG_DATA_DIR` env var (Docker pins it to `/data`)
 *   2. `~/.browser-gateway` if `HOME` is set (global install, npx, dev laptop)
 *   3. `./data` relative to CWD (last-resort fallback)
 *
 * Creates the directory (with parents) and returns its absolute path. mode
 * 0700 — gateway state is not for other users on a shared host.
 */
export declare function resolveDataDir(): string;
//# sourceMappingURL=data-dir.d.ts.map