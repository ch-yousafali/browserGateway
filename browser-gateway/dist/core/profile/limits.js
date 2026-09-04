export const DEFAULT_PROFILE_LIMITS = {
    softWarnBytes: 5 * 1024 * 1024,
    hardCapBytes: 50 * 1024 * 1024,
    maxOrigins: 1000,
};
/** Enforces size and origin-count caps on a profile. Returns a new profile; input untouched. */
export function enforceProfileLimits(profile, limits = {}) {
    const softWarnBytes = limits.softWarnBytes ?? DEFAULT_PROFILE_LIMITS.softWarnBytes;
    const hardCapBytes = limits.hardCapBytes ?? DEFAULT_PROFILE_LIMITS.hardCapBytes;
    const maxOrigins = limits.maxOrigins ?? DEFAULT_PROFILE_LIMITS.maxOrigins;
    const evicted = [];
    let storage = { ...profile.storage };
    const originEntries = Object.entries(storage);
    if (originEntries.length > maxOrigins) {
        const ranked = originEntries
            .map(([origin, data]) => ({ origin, ts: data.lastVisitedAt ? Date.parse(data.lastVisitedAt) : 0 }))
            .sort((a, b) => b.ts - a.ts);
        const keep = new Set(ranked.slice(0, maxOrigins).map((x) => x.origin));
        storage = {};
        for (const [origin, data] of originEntries) {
            if (keep.has(origin)) {
                storage[origin] = data;
            }
            else {
                evicted.push(origin);
            }
        }
    }
    const current = { ...profile, storage };
    let bytes = serializedSize(current);
    while (bytes > hardCapBytes && Object.keys(current.storage).length > 0) {
        const oldest = pickOldestOrigin(current.storage);
        if (!oldest)
            break;
        delete current.storage[oldest];
        evicted.push(oldest);
        bytes = serializedSize(current);
    }
    if (bytes > hardCapBytes) {
        return {
            profile,
            bytes,
            evictedOrigins: evicted,
            softWarn: true,
            refused: true,
            refusedReason: `serialized profile exceeds hardCapBytes (${bytes} > ${hardCapBytes}) even with all origins removed`,
        };
    }
    return {
        profile: current,
        bytes,
        evictedOrigins: evicted,
        softWarn: bytes > softWarnBytes,
        refused: false,
    };
}
function serializedSize(profile) {
    return Buffer.byteLength(JSON.stringify(profile), "utf-8");
}
function pickOldestOrigin(storage) {
    let oldest = null;
    for (const [origin, data] of Object.entries(storage)) {
        const ts = data.lastVisitedAt ? Date.parse(data.lastVisitedAt) : 0;
        if (!oldest || ts < oldest.ts)
            oldest = { origin, ts };
    }
    return oldest?.origin ?? null;
}
//# sourceMappingURL=limits.js.map