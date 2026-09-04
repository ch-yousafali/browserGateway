/** UI copy strings shared between OSS and SaaS provider forms. Keeping them
 *  here means changes to wording land in both dashboards in one edit. */
export declare const PROVIDER_FORM_COPY: {
    readonly name: {
        readonly label: "Provider name";
        readonly placeholder: "my-playwright, cloud-provider, office-chrome";
        readonly hint: "Unique name to identify this provider. Lowercase, numbers, hyphens.";
    };
    readonly url: {
        readonly label: "Provider URL";
        readonly placeholder: "wss://provider.com?token=xxx or http://localhost:9222";
        readonly hint: "wss:// for cloud services, ws:// for local WebSocket servers, or http:// for Chrome remote debugging. Include the API token in the URL if the provider requires one.";
    };
    readonly profile: {
        readonly label: "Which profiles it serves";
        readonly anyOption: "Any profile";
        readonly noneOption: "Sessions with no profile";
        readonly hintAny: "Loads any profile a client asks for. This provider starts a fresh browser each session, so write-back is safe.";
        readonly hintAnyDetecting: "Checking provider capabilities…";
        readonly hintAnyExternal: "On this provider only read-only profile sessions land here. Write-back requests need a pinned profile.";
        readonly hintPinned: (slug: string) => string;
        readonly hintNone: "Only sessions with no ?profile= are sent here.";
    };
    readonly maxConcurrent: {
        readonly label: "Max connections";
        readonly placeholder: "No limit";
        readonly hint: "Max simultaneous sessions. Empty for no limit.";
    };
    readonly priority: {
        readonly label: "Priority";
        readonly placeholder: "100";
        readonly hintStatic: "Lower wins. 1 for primary, 100 for fallback.";
    };
    readonly weight: {
        readonly label: "Weight";
        readonly placeholder: "100";
        readonly hintStatic: "Higher receives more traffic when providers share a priority.";
    };
    readonly advanced: {
        readonly label: "Advanced";
        readonly headersLabel: "Custom headers";
        readonly headersHint: "Sent on the WebSocket upgrade to the provider. Use for providers that require Bearer tokens or custom auth.";
        readonly addHeader: "Add header";
        readonly headerNamePlaceholder: "Authorization";
        readonly headerValuePlaceholder: "Bearer sk_live_...";
    };
    readonly actions: {
        readonly test: "Test";
        readonly testing: "Testing";
        readonly cancel: "Cancel";
        readonly addProvider: "Add provider";
        readonly saveChanges: "Save changes";
        readonly saving: "Saving";
        readonly adding: "Adding";
    };
    readonly testResult: {
        readonly ok: (latencyMs: number) => string;
        readonly fail: (reason: string) => string;
        readonly unknownReason: "unknown";
    };
};
//# sourceMappingURL=copy.d.ts.map