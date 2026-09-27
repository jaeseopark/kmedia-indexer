/**
 * Main Express server for Torznab indexer
 */
import 'dotenv/config.js';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initializeDatabase, searchTorrents, getAllTorrents, ingestTorrents, get24HourStats } from './db.js';
import { authenticateIngestWorker, validateJWTCookie, generateAuthToken, verifyAPIKey, type AuthenticatedRequest } from './middleware/auth.js';
import { xmlEscape } from './utils/xml.js';
import { initializeDailyReportScheduler, cancelDailyReportScheduler } from './utils/dailyReport.js';
import { renderLoginForm } from './templates/auth.js';
import { renderIndexPage } from './templates/index.js';
import type { SearchParams, Torrent } from './types.js';
import { IngestPayloadSchema } from '../../shared/schemas.js';

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
 * Index page - Health information and ingest form
 */
app.get('/', (req: AuthenticatedRequest, res: Response): void => {
  // Check if user has valid JWT
  if (!req.userId) {
    res.type('text/html; charset=utf-8').send(renderLoginForm());
    return;
  }

  const stats = get24HourStats();
  res.type('text/html; charset=utf-8').send(renderIndexPage({ stats }));
});

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
    res.status(401).type('text/html; charset=utf-8').send(renderLoginForm({ hasError: true }));
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
  res.redirect('/');
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
      <torznab:attr name="seeders" value="${item.seeders || 0}" />
      <torznab:attr name="leechers" value="${item.leechers || 0}" />
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
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`[${NODE_ENV}] Indexer listening on http://localhost:${PORT}`);
  console.log(`  GET  /                         - Admin page (requires login)`);
  console.log(`  GET  /api?t=caps               - Torznab capabilities`);
  console.log(`  GET  /api?t=search&q=<query>   - Torznab search`);
  console.log(`  POST /api/v1/ingest            - Ingest records (requires Bearer API key or valid JWT)`);
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
