export function resolvePort(cliOverride) {
    const raw = cliOverride ?? process.env.PORT;
    if (!raw)
        return undefined;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : undefined;
}
export function resolveHost() {
    return process.env.HOST ?? "0.0.0.0";
}
//# sourceMappingURL=port.js.map