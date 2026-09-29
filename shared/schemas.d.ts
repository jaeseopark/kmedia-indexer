/**
 * Shared Zod schemas for kmedia-indexer
 * Used by server and scraper for payload validation
 */
import { z } from 'zod';
/**
 * Torrent schema - represents a single torrent record
 */
export declare const TorrentSchema: z.ZodObject<{
    id: z.ZodString;
    category: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    magnet_url: z.ZodString;
    size_bytes: z.ZodDefault<z.ZodNumber>;
    seeders: z.ZodDefault<z.ZodNumber>;
    leechers: z.ZodDefault<z.ZodNumber>;
    published_at: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodString>;
    updated_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type Torrent = z.infer<typeof TorrentSchema>;
/**
 * IngestEntry schema - single entry in ingest payload
 */
export declare const IngestEntrySchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    category: z.ZodDefault<z.ZodString>;
    title: z.ZodString;
    magnet_url: z.ZodString;
    size_bytes: z.ZodDefault<z.ZodNumber>;
    seeders: z.ZodDefault<z.ZodNumber>;
    leechers: z.ZodDefault<z.ZodNumber>;
    published_at: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type IngestEntry = z.infer<typeof IngestEntrySchema>;
/**
 * IngestPayload schema - request body for ingest endpoint
 */
export declare const IngestPayloadSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        category: z.ZodDefault<z.ZodString>;
        title: z.ZodString;
        magnet_url: z.ZodString;
        size_bytes: z.ZodDefault<z.ZodNumber>;
        seeders: z.ZodDefault<z.ZodNumber>;
        leechers: z.ZodDefault<z.ZodNumber>;
        published_at: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
/**
 * IngestResponse schema - response from ingest endpoint
 * count: total records processed
 * created: number of new records inserted
 * updated: number of existing records updated
 */
export declare const IngestResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    count: z.ZodNumber;
    created: z.ZodOptional<z.ZodNumber>;
    updated: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
export type IngestResponse = z.infer<typeof IngestResponseSchema>;
/**
 * SearchParams schema - query parameters for search endpoint
 */
export declare const SearchParamsSchema: z.ZodObject<{
    t: z.ZodOptional<z.ZodEnum<{
        caps: "caps";
        search: "search";
        tvsearch: "tvsearch";
        movie: "movie";
    }>>;
    q: z.ZodOptional<z.ZodString>;
    offset: z.ZodDefault<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<number, string | number>>>;
    limit: z.ZodDefault<z.ZodPipe<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>, z.ZodTransform<number, string | number>>>;
    season: z.ZodOptional<z.ZodString>;
    ep: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type SearchParams = z.infer<typeof SearchParamsSchema>;
/**
 * Error response schema
 */
export declare const ErrorResponseSchema: z.ZodObject<{
    error: z.ZodString;
}, z.core.$strip>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
/**
 * Health check response schema
 */
export declare const HealthResponseSchema: z.ZodObject<{
    status: z.ZodEnum<{
        error: "error";
        ok: "ok";
        degraded: "degraded";
    }>;
    uptime: z.ZodNumber;
    database: z.ZodObject<{
        totalTorrents: z.ZodNumber;
        totalSize: z.ZodString;
    }, z.core.$strip>;
}, z.core.$strip>;
export type HealthResponse = z.infer<typeof HealthResponseSchema>;
//# sourceMappingURL=schemas.d.ts.map