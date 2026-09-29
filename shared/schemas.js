/**
 * Shared Zod schemas for kmedia-indexer
 * Used by server and scraper for payload validation
 */
import { z } from 'zod';
/**
 * Torrent schema - represents a single torrent record
 */
export const TorrentSchema = z.object({
    id: z.string(),
    category: z.string().default('2000'),
    title: z.string(),
    magnet_url: z.string().url(),
    size_bytes: z.number().int().nonnegative().default(0),
    seeders: z.number().int().nonnegative().default(0),
    leechers: z.number().int().nonnegative().default(0),
    published_at: z.string().datetime().optional(),
    created_at: z.string().datetime().optional(),
    updated_at: z.string().datetime().optional()
});
/**
 * IngestEntry schema - single entry in ingest payload
 */
export const IngestEntrySchema = z.object({
    id: z.string().optional(),
    category: z.string().default('2000'),
    title: z.string().min(1, 'Title is required'),
    magnet_url: z.string().url('Invalid magnet URL'),
    size_bytes: z.number().int().nonnegative().default(0),
    seeders: z.number().int().nonnegative().default(0),
    leechers: z.number().int().nonnegative().default(0),
    published_at: z.string().datetime().optional()
});
/**
 * IngestPayload schema - request body for ingest endpoint
 */
export const IngestPayloadSchema = z.object({
    entries: z.array(IngestEntrySchema).min(1, 'At least one entry is required')
});
/**
 * IngestResponse schema - response from ingest endpoint
 * count: total records processed
 * created: number of new records inserted
 * updated: number of existing records updated
 */
export const IngestResponseSchema = z.object({
    success: z.boolean(),
    count: z.number().int().nonnegative(),
    created: z.number().int().nonnegative().optional(),
    updated: z.number().int().nonnegative().optional()
}).passthrough();
/**
 * SearchParams schema - query parameters for search endpoint
 */
export const SearchParamsSchema = z.object({
    t: z.enum(['caps', 'search', 'tvsearch', 'movie']).optional(),
    q: z.string().optional(),
    offset: z.union([z.string(), z.number()]).transform(v => Number(v)).default(0),
    limit: z.union([z.string(), z.number()]).transform(v => Number(v)).default(100),
    season: z.string().optional(),
    ep: z.string().optional()
});
/**
 * Error response schema
 */
export const ErrorResponseSchema = z.object({
    error: z.string()
});
/**
 * Health check response schema
 */
export const HealthResponseSchema = z.object({
    status: z.enum(['ok', 'degraded', 'error']),
    uptime: z.number(),
    database: z.object({
        totalTorrents: z.number().int().nonnegative(),
        totalSize: z.string()
    })
});
//# sourceMappingURL=schemas.js.map