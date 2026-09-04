/** Internal ID allocator for pipeline-injected CDP commands. Uses the
 *  numeric range starting at 2^30 (1_073_741_824), well within Chrome's
 *  int32-positive tolerance and unreachable by any realistic client
 *  counting from 1. Additionally, all our IDs live in a pending-response
 *  Map so routing is by presence, not by value. */
export declare class InternalIdSpace {
    private next;
    private readonly pending;
    /** Allocate a fresh internal ID and register a pending response. */
    allocate(): {
        id: number;
        promise: Promise<unknown>;
    };
    /** True iff `id` belongs to an outstanding internal request. */
    owns(id: number): boolean;
    /** Resolve or reject the pending response for `id`. Returns false if the
     *  ID was not registered (in which case the caller should forward the
     *  message downstream as a normal client response). */
    settle(id: number, msg: {
        result?: unknown;
        error?: {
            code: number;
            message: string;
        };
    }): boolean;
    /** Reject every outstanding response — used on pipeline close. */
    rejectAll(reason: string): void;
    /** Number of outstanding internal responses. Test-only convenience. */
    get pendingCount(): number;
}
//# sourceMappingURL=id-space.d.ts.map