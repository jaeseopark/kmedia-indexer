/**
 * Shared TypeScript types for kmedia-indexer
 * Used by both server and worker implementations
 */

export interface Torrent {
  id: string;
  category: string;
  title: string;
  magnet_url: string;
  size_bytes: number;
  published_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface IngestEntry {
  id?: string;
  category?: string;
  title: string;
  magnet_url: string;
  size_bytes?: number;
  published_at?: string;
}

export interface IngestPayload {
  entries: IngestEntry[];
}

export interface IngestResponse {
  success: boolean;
  count: number;
  created?: number;
  updated?: number;
}

export interface SearchParams {
  t?: string;
  q?: string;
  offset?: string | number;
  limit?: string | number;
  season?: string;
  ep?: string;
}

export interface TorznabCaps {
  server: {
    title: string;
  };
  limits: {
    max: number;
    default: number;
  };
  searching: {
    search: {
      available: boolean;
      supportedParams: string;
    };
    tvsearch: {
      available: boolean;
      supportedParams: string;
    };
    movie: {
      available: boolean;
      supportedParams: string;
    };
  };
  categories: Array<{
    id: string;
    name: string;
  }>;
}
