/**
 * Database initialization and schema setup
 */
import Database from 'better-sqlite3';
import type { Torrent, IngestEntry } from './types.js';

const DB_PATH = process.env.DB_PATH || 'indexer.db';

const db: Database.Database = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Initialize database schema if not exists
 */
export function initializeDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS torrents (
      id TEXT PRIMARY KEY,
      category TEXT DEFAULT '2000',
      title TEXT NOT NULL,
      magnet_url TEXT NOT NULL,
      size_bytes INTEGER DEFAULT 0,
      seeders INTEGER DEFAULT 0,
      leechers INTEGER DEFAULT 0,
      published_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_torrents_title ON torrents(title);
    CREATE INDEX IF NOT EXISTS idx_torrents_created_at ON torrents(created_at DESC);
  `);
}

/**
 * Lazy-prepare statements after database initialization
 */
let selectTorrentsByTitle: any;
let selectAllTorrents: any;
let selectTorrentById: any;
let upsertTorrent: any;

function prepareStatements(): void {
  selectTorrentsByTitle = db.prepare(`
    SELECT * FROM torrents 
    WHERE LOWER(title) LIKE LOWER(?)
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `);

  selectAllTorrents = db.prepare(`
    SELECT * FROM torrents 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `);

  selectTorrentById = db.prepare(`
    SELECT * FROM torrents WHERE id = ?
  `);

  upsertTorrent = db.prepare(`
    INSERT INTO torrents (id, category, title, magnet_url, size_bytes, seeders, leechers, published_at)
    VALUES (@id, @category, @title, @magnet_url, @size_bytes, @seeders, @leechers, @published_at)
    ON CONFLICT(id) DO UPDATE SET
      category=excluded.category,
      title=excluded.title,
      magnet_url=excluded.magnet_url,
      size_bytes=excluded.size_bytes,
      seeders=excluded.seeders,
      leechers=excluded.leechers,
      published_at=excluded.published_at
  `);
}

/**
 * Database query functions
 */
export function searchTorrents(query: string, limit: number, offset: number): Torrent[] {
  if (!selectTorrentsByTitle) prepareStatements();
  return selectTorrentsByTitle.all(`%${query}%`, limit, offset) as Torrent[];
}

export function getAllTorrents(limit: number, offset: number): Torrent[] {
  if (!selectAllTorrents) prepareStatements();
  return selectAllTorrents.all(limit, offset) as Torrent[];
}

export function getTorrentById(id: string): Torrent | undefined {
  if (!selectTorrentById) prepareStatements();
  return selectTorrentById.get(id) as Torrent | undefined;
}

/**
 * Ingest torrents with transaction support
 */
export function ingestTorrents(entries: IngestEntry[]): number {
  if (!upsertTorrent) prepareStatements();
  
  const insertTransaction = db.transaction((items: IngestEntry[]) => {
    let ingestedCount = 0;
    for (const item of items) {
      if (item.magnet_url && item.title) {
        upsertTorrent.run({
          id: item.id || item.magnet_url,
          category: item.category || '2000',
          title: item.title,
          magnet_url: item.magnet_url,
          size_bytes: item.size_bytes || 0,
          seeders: item.seeders || 0,
          leechers: item.leechers || 0,
          published_at: item.published_at || new Date().toISOString()
        });
        ingestedCount++;
      }
    }
    return ingestedCount;
  });

  return insertTransaction(entries);
}

/**
 * Get database statistics
 */
export function getDbStats(): { totalTorrents: number; totalSize: bigint } {
  const stats = db.prepare('SELECT COUNT(*) as count, COALESCE(SUM(size_bytes), 0) as total_size FROM torrents').get() as any;
  return {
    totalTorrents: stats.count || 0,
    totalSize: stats.total_size || 0n
  };
}

export default db;
