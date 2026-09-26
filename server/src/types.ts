/**
 * Local TypeScript types for server
 * (also defined in shared/types for worker integration)
 */

export interface Torrent {
  id: string;
  category: string;
  title: string;
  magnet_url: string;
  size_bytes: number;
  seeders: number;
  leechers: number;
  published_at: string;
  created_at?: string;
}

export interface IngestEntry {
  id?: string;
  category?: string;
  title: string;
  magnet_url: string;
  size_bytes?: number;
  seeders?: number;
  leechers?: number;
  published_at?: string;
}

export interface IngestPayload {
  entries: IngestEntry[];
}

export interface SearchParams {
  t?: string;
  q?: string;
  offset?: string | number;
  limit?: string | number;
  season?: string;
  ep?: string;
}
