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
  // Create table with schema
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_torrents_title ON torrents(title);
    CREATE INDEX IF NOT EXISTS idx_torrents_created_at ON torrents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_torrents_updated_at ON torrents(updated_at DESC);
  `);

  // Migrate existing records: set updated_at to created_at if it's NULL
  // Wrapped in try-catch in case column doesn't exist in old schema
  try {
    db.exec(`UPDATE torrents SET updated_at = created_at WHERE updated_at IS NULL;`);
  } catch (err) {
    // Column might not exist in old database schema - this is okay
    console.warn('Migration note: Could not update updated_at column');
  }
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
    INSERT INTO torrents (id, category, title, magnet_url, size_bytes, seeders, leechers, published_at, updated_at)
    VALUES (@id, @category, @title, @magnet_url, @size_bytes, @seeders, @leechers, @published_at, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      category=excluded.category,
      title=excluded.title,
      magnet_url=excluded.magnet_url,
      size_bytes=excluded.size_bytes,
      seeders=excluded.seeders,
      leechers=excluded.leechers,
      published_at=excluded.published_at,
      updated_at=CURRENT_TIMESTAMP
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
 * Returns count, created, and updated statistics
 * @param entries Array of torrent entries to ingest
 * @returns Object with total count, created count, and updated count
 */
export function ingestTorrents(entries: IngestEntry[]): { count: number; created: number; updated: number } {
  if (!upsertTorrent) prepareStatements();
  if (!selectTorrentById) prepareStatements();
  
  const insertTransaction = db.transaction((items: IngestEntry[]) => {
    let createdCount = 0;
    let updatedCount = 0;
    
    for (const item of items) {
      if (item.magnet_url && item.title) {
        const id = item.id || item.magnet_url;
        
        // Check if record already exists
        const existingRecord = selectTorrentById.get(id) as Torrent | undefined;
        const isUpdate = !!existingRecord;
        
        upsertTorrent.run({
          id,
          category: item.category || '2000',
          title: item.title,
          magnet_url: item.magnet_url,
          size_bytes: item.size_bytes || 0,
          seeders: item.seeders || 0,
          leechers: item.leechers || 0,
          published_at: item.published_at || new Date().toISOString()
        });
        
        if (isUpdate) {
          updatedCount++;
        } else {
          createdCount++;
        }
      }
    }
    
    return { count: createdCount + updatedCount, created: createdCount, updated: updatedCount };
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

/**
 * Get statistics for the last 24 hours (newly ingested or updated)
 */
export function get24HourStats(): { count: number; titles: string[] } {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  
  const countResult = db.prepare(`
    SELECT COUNT(*) as count FROM torrents 
    WHERE updated_at >= ?
  `).get(oneDayAgo) as any;

  const titlesResult = db.prepare(`
    SELECT DISTINCT title FROM torrents 
    WHERE updated_at >= ?
    ORDER BY updated_at DESC
    LIMIT 2
  `).all(oneDayAgo) as Array<{ title: string }>;

  return {
    count: countResult.count || 0,
    titles: titlesResult.map(row => row.title)
  };
}

export default db;
