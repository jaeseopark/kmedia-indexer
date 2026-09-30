/**
 * Main Express server for Torznab indexer
 */
import 'dotenv/config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeDatabase, searchTorrents, getAllTorrents, ingestTorrents, get24HourStats, getAllProviders, getProvider, upsertProvider, deactivateProvider } from './db.js';
import { authenticateIngestWorker, validateJWTCookie, generateAuthToken, verifyAPIKey, type AuthenticatedRequest } from './middleware/auth.js';
import { xmlEscape } from './utils/xml.js';
import { initializeDailyReportScheduler, cancelDailyReportScheduler } from './utils/dailyReport.js';
import type { SearchParams, Torrent } from './types.js';
import { IngestPayloadSchema } from '../../shared/schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

const app: Express = express();

/**
 * Middleware setup
 */
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(validateJWTCookie);

/**
 * Initialize database on startup
 */
initializeDatabase();

/**
 * Initialize daily report scheduler
 */
initializeDailyReportScheduler();

/**
 * Serve React UI app from public directory
 * Falls back to index.html for SPA routing
 */
app.use(express.static(path.join(__dirname, '../../public')));

/**
 * Health check endpoint
 */
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok' });
});

/**
 * Login endpoint - validate API key and return JWT cookie
 */
app.post('/login', express.urlencoded({ extended: false }), (req: Request, res: Response): void => {
  const { apiKey } = req.body;

  if (!apiKey || !verifyAPIKey(apiKey)) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  const token = generateAuthToken();
  res.cookie('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.redirect('/');
});

/**
 * Logout endpoint
 */
app.get('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * ==========================================
 * 0. UI API ENDPOINTS
 * ==========================================
 */

/**
 * GET /api/v1/stats - Get 24-hour health statistics (requires authentication)
 * Used by React UI dashboard
 */
app.get('/api/v1/stats', (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stats = get24HourStats();
    return res.json(stats);
  } catch (err: any) {
    console.error('Error fetching stats:', err);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * ==========================================
 * 1. PUBLIC CONTRACT: TORZNAB INTERFACE
 * ==========================================
 */

app.get('/api', (req: Request, res: Response) => {
  const { t, q, offset = '0', limit = '100' } = req.query as SearchParams;

  /**
   * Capabilities endpoint
   */
  if (t === 'caps') {
    res.type('application/xml');
    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<caps>
  <server title="kmedia-indexer Torznab Server" />
  <limits max="500" default="100" />
  <searching>
    <search available="yes" supportedParams="q" />
    <tv-search available="yes" supportedParams="q,season,ep" />
    <movie-search available="yes" supportedParams="q" />
  </searching>
  <categories>
    <category id="2000" name="Movies" />
    <category id="5000" name="TV" />
  </categories>
</caps>`);
  }

  /**
   * Torznab search endpoints
   */
  if (t === 'search' || t === 'tvsearch' || t === 'movie') {
    res.type('application/xml');
    
    const offsetNum = Math.max(0, parseInt(offset as string) || 0);
    const limitNum = Math.min(500, Math.max(1, parseInt(limit as string) || 100));
    const searchTerm = (q || '').toString().trim().toLowerCase();

    let results: Torrent[] = [];

    if (searchTerm) {
      results = searchTorrents(searchTerm, limitNum, offsetNum);
    } else {
      results = getAllTorrents(limitNum, offsetNum);
    }

    const itemsXml = results
      .map((item) => {
        const pubDate = new Date(item.published_at || item.created_at || new Date()).toUTCString();
        
        return `
    <item>
      <title>${xmlEscape(item.title)}</title>
      <guid isPermaLink="false">${xmlEscape(item.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <type>torrent</type>
      <link>${xmlEscape(item.magnet_url)}</link>
      <enclosure url="${xmlEscape(item.magnet_url)}" length="${item.size_bytes || 0}" type="application/x-bittorrent" />
      <torznab:attr name="magneturl" value="${xmlEscape(item.magnet_url)}" />
      <torznab:attr name="category" value="${xmlEscape(item.category || '2000')}" />
    </item>`;
      })
      .join('');

    return res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:torznab="http://torznab.com/schemas/2015/feed">
  <channel>
    <title>kmedia-indexer Torznab Feed</title>
    <description>Local SQLite Torrent Indexer</description>
    ${itemsXml}
  </channel>
</rss>`);
  }

  return res.status(400).send('Unsupported Torznab parameter');
});

/**
 * ==========================================
 * 2. SCRAPER INGEST CONTRACT
 * ==========================================
 */

app.post('/api/v1/ingest', authenticateIngestWorker, (req: Request, res: Response) => {
  try {
    // Validate payload using zod schema
    const validatedPayload = IngestPayloadSchema.parse(req.body);
    const { entries } = validatedPayload;

    const result = ingestTorrents(entries);
    return res.json({ success: true, count: result.count, created: result.created, updated: result.updated });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      console.warn('Ingest validation error:', err.errors);
      return res.status(400).json({ error: 'Invalid payload schema', details: err.errors });
    }
    console.error('Ingest database write error:', err);
    return res.status(500).json({ error: 'Failed to process ingest payload' });
  }
});

/**
 * ==========================================
 * 3. PROVIDER MANAGEMENT API
 * ==========================================
 */

/**
 * GET /api/v1/providers - List all active magnet providers
 * Used by scraper to fetch provider configurations
 */
app.get('/api/v1/providers', (_req: Request, res: Response) => {
  try {
    const providers = getAllProviders();
    return res.json({
      success: true,
      count: providers.length,
      providers: providers.map(p => ({
        provider: p.provider,
        base_url: p.base_url,
        description: p.description
      }))
    });
  } catch (err: any) {
    console.error('Error fetching providers:', err);
    return res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

/**
 * GET /api/v1/providers/:provider - Get specific provider config
 * Used by scraper when it needs to validate or fetch a specific provider
 */
app.get('/api/v1/providers/:provider', (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const config = getProvider(provider);
    
    if (!config) {
      return res.status(404).json({ error: `Provider '${provider}' not found` });
    }
    
    return res.json({
      success: true,
      provider: config.provider,
      base_url: config.base_url,
      description: config.description
    });
  } catch (err: any) {
    console.error('Error fetching provider:', err);
    return res.status(500).json({ error: 'Failed to fetch provider' });
  }
});

/**
 * POST /api/v1/providers - Create or update a provider
 * Requires Bearer token authentication
 * Body: { provider: string, base_url: string, description?: string }
 */
app.post('/api/v1/providers', authenticateIngestWorker, (req: Request, res: Response) => {
  try {
    const { provider, base_url, description } = req.body;
    
    if (!provider || !base_url) {
      return res.status(400).json({ error: 'Missing required fields: provider, base_url' });
    }
    
    if (typeof provider !== 'string' || typeof base_url !== 'string') {
      return res.status(400).json({ error: 'Fields must be strings' });
    }
    
    const updated = upsertProvider(provider, base_url, description);
    return res.json({
      success: true,
      message: `Provider '${provider}' updated successfully`,
      provider: {
        provider: updated.provider,
        base_url: updated.base_url,
        description: updated.description
      }
    });
  } catch (err: any) {
    console.error('Error updating provider:', err);
    return res.status(500).json({ error: 'Failed to update provider' });
  }
});

/**
 * DELETE /api/v1/providers/:provider - Deactivate a provider
 * Requires Bearer token authentication
 */
app.delete('/api/v1/providers/:provider', authenticateIngestWorker, (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const deactivated = deactivateProvider(provider);
    
    if (!deactivated) {
      return res.status(404).json({ error: `Provider '${provider}' not found or already inactive` });
    }
    
    return res.json({
      success: true,
      message: `Provider '${provider}' deactivated successfully`
    });
  } catch (err: any) {
    console.error('Error deactivating provider:', err);
    return res.status(500).json({ error: 'Failed to deactivate provider' });
  }
});

/**
 * SPA fallback - serve index.html for non-API routes
 * This allows React Router to handle client-side routing
 */
app.get('*', (_req: Request, res: Response): void => {
  if (_req.path.startsWith('/api/')) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Indexer listening on http://localhost:${PORT}`);
  console.log(`  GET  /                         - React UI SPA (requires login)`);
  console.log(`  POST /login                    - Authenticate with API key`);
  console.log(`  GET  /logout                   - Logout`);
  console.log(`  GET  /api?t=caps               - Torznab capabilities`);
  console.log(`  GET  /api?t=search&q=<query>   - Torznab search`);
  console.log(`  GET  /api/v1/stats             - Get health stats (requires auth)`);
  console.log(`  POST /api/v1/ingest            - Ingest records (requires Bearer API key or valid JWT)`);
  console.log(`  GET  /api/v1/providers         - Get all magnet providers`);
  console.log(`  GET  /api/v1/providers/:name   - Get specific provider config`);
  console.log(`  POST /api/v1/providers         - Create/update provider (requires Bearer API key)`);
  console.log(`  DELETE /api/v1/providers/:name - Deactivate provider (requires Bearer API key)`);
  console.log(`  GET  /health                   - Health check`);
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  cancelDailyReportScheduler();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
