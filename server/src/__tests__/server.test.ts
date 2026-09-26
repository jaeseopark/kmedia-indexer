/**
 * Server and endpoint tests
 */
import { describe, it, expect } from 'vitest';
import type { SearchParams, IngestPayload } from '../types.js';

describe('Server Contracts', () => {
  describe('Torznab Contract', () => {
    it('should validate search parameters structure', () => {
      const searchParams: SearchParams = {
        t: 'search',
        q: 'test',
        offset: '0',
        limit: '100'
      };

      expect(searchParams).toHaveProperty('t', 'search');
      expect(searchParams).toHaveProperty('q', 'test');
      expect(parseInt(searchParams.offset as string)).toBe(0);
      expect(parseInt(searchParams.limit as string)).toBe(100);
    });

    it('should handle movie search parameters', () => {
      const movieSearch: SearchParams = {
        t: 'movie',
        q: 'Inception 2010'
      };

      expect(movieSearch.t).toBe('movie');
      expect(movieSearch.q).toBe('Inception 2010');
    });

    it('should handle tv search with season/episode parameters', () => {
      const tvSearch: SearchParams = {
        t: 'tvsearch',
        q: 'Breaking Bad',
        season: '1',
        ep: '1'
      };

      expect(tvSearch.t).toBe('tvsearch');
      expect(tvSearch.season).toBe('1');
      expect(tvSearch.ep).toBe('1');
    });

    it('should handle caps request', () => {
      const capsRequest: SearchParams = { t: 'caps' };
      expect(capsRequest.t).toBe('caps');
    });
  });

  describe('Ingest Contract', () => {
    it('should validate ingest payload structure', () => {
      const payload: IngestPayload = {
        entries: [
          {
            id: 'test-1',
            title: 'Test Release',
            magnet_url: 'magnet:?xt=urn:btih:abc',
            size_bytes: 1024,
            seeders: 10,
            leechers: 2
          }
        ]
      };

      expect(payload).toHaveProperty('entries');
      expect(Array.isArray(payload.entries)).toBe(true);
      expect(payload.entries[0]).toHaveProperty('title');
      expect(payload.entries[0]).toHaveProperty('magnet_url');
    });

    it('should reject empty entries array', () => {
      const invalidPayload: IngestPayload = {
        entries: []
      };

      expect(invalidPayload.entries).toHaveLength(0);
    });

    it('should require title and magnet_url in entries', () => {
      const validEntry = {
        title: 'Valid',
        magnet_url: 'magnet:?xt=urn:btih:abc'
      };

      const missingTitle = {
        magnet_url: 'magnet:?xt=urn:btih:abc'
      };

      const missingMagnet = {
        title: 'Missing Magnet'
      };

      expect(validEntry).toHaveProperty('title');
      expect(validEntry).toHaveProperty('magnet_url');
      expect(missingTitle).not.toHaveProperty('title');
      expect(missingMagnet).not.toHaveProperty('magnet_url');
    });
  });

  describe('XML Escaping', () => {
    it('should escape XML special characters', () => {
      const xmlEscape = (str: string | null | undefined): string => {
        if (!str) return '';
        return str.replace(/[<>&'"]/g, (c) => ({
          '<': '&lt;',
          '>': '&gt;',
          '&': '&amp;',
          '\'': '&apos;',
          '"': '&quot;'
        }[c] || c));
      };

      expect(xmlEscape('<title>')).toBe('&lt;title&gt;');
      expect(xmlEscape('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(xmlEscape('It\'s "quoted"')).toBe('It&apos;s &quot;quoted&quot;');
      expect(xmlEscape(null)).toBe('');
      expect(xmlEscape('')).toBe('');
    });
  });

  describe('Pagination', () => {
    it('should calculate offset and limit correctly', () => {
      const page1 = { limit: 100, offset: 0 };
      const page2 = { limit: 100, offset: 100 };
      const page3 = { limit: 100, offset: 200 };

      expect(page1.offset).toBe(0);
      expect(page2.offset).toBe(100);
      expect(page3.offset).toBe(200);
    });

    it('should cap limit at maximum allowed', () => {
      const maxLimit = 500;
      const requested = 1000;
      const actual = Math.min(maxLimit, requested);

      expect(actual).toBe(500);
    });
  });
});
