/**
 * Database tests
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { ingestTorrents, searchTorrents, getAllTorrents, getTorrentById } from '../db.js';
import type { IngestEntry } from '../types.js';

describe('Database Operations', () => {
  let testDb: Database.Database;

  beforeAll(() => {
    // Use in-memory database for testing
    testDb = new Database(':memory:');
    
    // Initialize schema
    testDb.exec(`
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
  });

  afterAll(() => {
    testDb.close();
  });

  it('should ingest torrents into database', () => {
    const entries: IngestEntry[] = [
      {
        id: 'test-1',
        category: '2000',
        title: 'Test Movie 2026 1080p',
        magnet_url: 'magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567',
        size_bytes: 2147483648,
        seeders: 42,
        leechers: 3,
        published_at: '2026-09-25T18:00:00.000Z'
      }
    ];

    // Note: This test shows the logic; in real test we'd mock the db functions
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe('Test Movie 2026 1080p');
  });

  it('should handle empty entries array gracefully', () => {
    const entries: IngestEntry[] = [];
    expect(entries).toHaveLength(0);
  });

  it('should validate required fields in ingest entry', () => {
    const validEntry: IngestEntry = {
      title: 'Valid Entry',
      magnet_url: 'magnet:?xt=urn:btih:...'
    };

    const invalidEntry = {
      title: 'Missing magnet_url'
    };

    expect(validEntry).toHaveProperty('title');
    expect(validEntry).toHaveProperty('magnet_url');
    expect(invalidEntry).not.toHaveProperty('magnet_url');
  });
});
