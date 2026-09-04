import { z } from "zod";
export declare const ProviderConfigSchema: z.ZodObject<{
    url: z.ZodString;
    limits: z.ZodOptional<z.ZodObject<{
        maxConcurrent: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strip>>;
    priority: z.ZodDefault<z.ZodNumber>;
    weight: z.ZodDefault<z.ZodNumber>;
    profile: z.ZodOptional<z.ZodString>;
    multiProfile: z.ZodDefault<z.ZodBoolean>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const WebhookSchema: z.ZodObject<{
    url: z.ZodString;
    events: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const ProfilesConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    store: z.ZodDefault<z.ZodEnum<{
        filesystem: "filesystem";
    }>>;
    filesystem: z.ZodDefault<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    encryption: z.ZodDefault<z.ZodObject<{
        keyEnv: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    lockTtlMs: z.ZodDefault<z.ZodNumber>;
    cdpTimeoutMs: z.ZodDefault<z.ZodNumber>;
    commitTimeoutMs: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ProfilesConfig = z.infer<typeof ProfilesConfigSchema>;
export declare const ReplayConfigSchema: z.ZodObject<{
    store: z.ZodDefault<z.ZodEnum<{
        filesystem: "filesystem";
    }>>;
    filesystem: z.ZodDefault<z.ZodObject<{
        path: z.ZodDefault<z.ZodString>;
    }, z.core.$strip>>;
    retentionDays: z.ZodDefault<z.ZodNumber>;
    maxBytesPerSession: z.ZodDefault<z.ZodNumber>;
    capture: z.ZodDefault<z.ZodObject<{
        format: z.ZodDefault<z.ZodEnum<{
            png: "png";
            jpeg: "jpeg";
        }>>;
        quality: z.ZodDefault<z.ZodNumber>;
        everyNthFrame: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
}, z.core.$loose>;
export type ReplayConfig = z.infer<typeof ReplayConfigSchema>;
export declare const GatewayConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodNumber>;
    gateway: z.ZodDefault<z.ZodObject<{
        port: z.ZodDefault<z.ZodNumber>;
        defaultStrategy: z.ZodDefault<z.ZodEnum<{
            "priority-chain": "priority-chain";
            "round-robin": "round-robin";
            "least-connections": "least-connections";
            "latency-optimized": "latency-optimized";
            weighted: "weighted";
        }>>;
        healthCheckInterval: z.ZodDefault<z.ZodNumber>;
        connectionTimeout: z.ZodDefault<z.ZodNumber>;
        shutdownDrainMs: z.ZodDefault<z.ZodNumber>;
        cooldown: z.ZodDefault<z.ZodObject<{
            defaultMs: z.ZodDefault<z.ZodNumber>;
            failureThreshold: z.ZodDefault<z.ZodNumber>;
            minRequestVolume: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        sessions: z.ZodDefault<z.ZodObject<{
            idleTimeoutMs: z.ZodDefault<z.ZodNumber>;
            reconnectTimeoutMs: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
        queue: z.ZodDefault<z.ZodObject<{
            maxSize: z.ZodDefault<z.ZodNumber>;
            timeoutMs: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
    providers: z.ZodRecord<z.ZodString, z.ZodObject<{
        url: z.ZodString;
        limits: z.ZodOptional<z.ZodObject<{
            maxConcurrent: z.ZodOptional<z.ZodNumber>;
        }, z.core.$strip>>;
        priority: z.ZodDefault<z.ZodNumber>;
        weight: z.ZodDefault<z.ZodNumber>;
        profile: z.ZodOptional<z.ZodString>;
        multiProfile: z.ZodDefault<z.ZodBoolean>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, z.core.$strip>>;
    pool: z.ZodDefault<z.ZodObject<{
        minSessions: z.ZodDefault<z.ZodNumber>;
        maxSessions: z.ZodDefault<z.ZodNumber>;
        maxPagesPerSession: z.ZodDefault<z.ZodNumber>;
        retireAfterPages: z.ZodDefault<z.ZodNumber>;
        retireAfterMs: z.ZodDefault<z.ZodNumber>;
        idleTimeoutMs: z.ZodDefault<z.ZodNumber>;
        pageTimeoutMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    webhooks: z.ZodDefault<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        events: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>>>;
    dashboard: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>;
    logging: z.ZodDefault<z.ZodObject<{
        level: z.ZodDefault<z.ZodEnum<{
            error: "error";
            debug: "debug";
            info: "info";
            warn: "warn";
        }>>;
    }, z.core.$strip>>;
    profiles: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        store: z.ZodDefault<z.ZodEnum<{
            filesystem: "filesystem";
        }>>;
        filesystem: z.ZodDefault<z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        encryption: z.ZodDefault<z.ZodObject<{
            keyEnv: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        lockTtlMs: z.ZodDefault<z.ZodNumber>;
        cdpTimeoutMs: z.ZodDefault<z.ZodNumber>;
        commitTimeoutMs: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>>;
    replay: z.ZodDefault<z.ZodObject<{
        store: z.ZodDefault<z.ZodEnum<{
            filesystem: "filesystem";
        }>>;
        filesystem: z.ZodDefault<z.ZodObject<{
            path: z.ZodDefault<z.ZodString>;
        }, z.core.$strip>>;
        retentionDays: z.ZodDefault<z.ZodNumber>;
        maxBytesPerSession: z.ZodDefault<z.ZodNumber>;
        capture: z.ZodDefault<z.ZodObject<{
            format: z.ZodDefault<z.ZodEnum<{
                png: "png";
                jpeg: "jpeg";
            }>>;
            quality: z.ZodDefault<z.ZodNumber>;
            everyNthFrame: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strip>>;
    }, z.core.$loose>>;
}, z.core.$strip>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type GatewayConfig = z.infer<typeof GatewayConfigSchema>;
export interface ProviderState {
    id: string;
    config: ProviderConfig;
    active: number;
    healthy: boolean;
    cooldownUntil: number | null;
    failureCount: number;
    successCount: number;
    lastFailure: number | null;
    avgLatencyMs: number;
    totalConnections: number;
    /** Vendor detected by the capability probe; `null` until a probe identifies one. */
    detectedKind: "browserserve" | null;
    /** Concurrency ceiling the provider advertised; adopted when `limits.maxConcurrent` is unset. */
    discoveredMaxConcurrent: number | null;
}
export interface Session {
    id: string;
    providerId: string;
    profileId?: string;
    connectedAt: number;
    lastActivity: number;
    messageCount: number;
}
//# sourceMappingURL=types.d.ts.map