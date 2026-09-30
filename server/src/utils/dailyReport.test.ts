import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { generateDailyReportMessage, sendDailyReport } from './dailyReport.js';
import * as dbModule from '../db.js';

describe('Daily Report', () => {
  beforeAll(() => {
    // Initialize database for tests
    dbModule.initializeDatabase();
  });

  describe('generateDailyReportMessage', () => {
    it('should generate a report with zero records', () => {
      const message = generateDailyReportMessage();
      
      expect(message).toContain('DAILY INGESTION REPORT');
      expect(message).toContain('Records in last 24 hours: 0');
      expect(message).toContain('No records ingested in the last 24 hours');
    });

    it('should include latest titles when records exist', () => {
      // Ingest some test data
      dbModule.ingestTorrents([
        {
          id: 'test-1',
          title: 'Test Torrent 1',
          magnet_url: 'magnet:?xt=urn:btih:test1',
          category: '5000',
          seeders: 10,
          leechers: 5,
        },
        {
          id: 'test-2',
          title: 'Test Torrent 2',
          magnet_url: 'magnet:?xt=urn:btih:test2',
          category: '2000',
          seeders: 20,
          leechers: 3,
        },
      ]);

      const message = generateDailyReportMessage();
      
      expect(message).toContain('DAILY INGESTION REPORT');
      expect(message).toContain('Records in last 24 hours: 2');
      expect(message).toContain('Latest titles:');
      // Should have at least one title (up to 2 titles shown)
      expect(message).toMatch(/1\. Test Torrent/);
    });
  });

  describe('sendDailyReport', () => {
    it('should skip sending if NTFY_TOPIC is not set', async () => {
      // The function should complete without error
      // Since NTFY_TOPIC is not set in test environment
      await sendDailyReport();
      // If we get here without error, the test passes
      expect(true).toBe(true);
    });
  });
});
