/**
 * Provider configuration fetcher
 * Fetches magnet provider configurations from server and caches them locally
 * Allows scraper to use dynamic base URLs instead of hardcoded ones
 */

import { getHttpClient } from './http.js';

export interface ProviderConfig {
  provider: string;
  base_url: string;
  description?: string;
}

// Local cache of provider configs (valid only for current scraper run)
let providerCache: Map<string, ProviderConfig> | null = null;

/**
 * Fetch provider configurations from server
 * Falls back to hardcoded defaults if server is unavailable
 * 
 * @param serverUrl - Base URL of the kmedia-indexer server
 * @returns Map of provider name to configuration
 */
export async function fetchProviderConfigs(serverUrl: string): Promise<Map<string, ProviderConfig>> {
  console.log('[ProviderConfig] Fetching provider configurations from server...');

  try {
    const httpClient = getHttpClient();
    const html = await httpClient.fetchHtml(`${serverUrl}/api/v1/providers`);
    const response = JSON.parse(html);

    if (!response.success || !response.providers) {
      throw new Error('Invalid response format from server');
    }

    // Build provider cache
    const cache = new Map<string, ProviderConfig>();
    for (const provider of response.providers) {
      cache.set(provider.provider, {
        provider: provider.provider,
        base_url: provider.base_url,
        description: provider.description
      });
    }

    providerCache = cache;
    console.log(`[ProviderConfig] ✓ Loaded ${cache.size} provider configurations`);

    return cache;
  } catch (err) {
    const error = err as any;
    console.warn('[ProviderConfig] ⚠️  Failed to fetch from server, using defaults:', error.message);
    
    // Return hardcoded defaults as fallback
    return getDefaultProviders();
  }
}

/**
 * Get provider configuration by name
 * 
 * @param provider - Provider name (e.g., "tfreeca", "torrenttip")
 * @returns Provider configuration or undefined if not found
 */
export function getProviderConfig(provider: string): ProviderConfig | undefined {
  if (!providerCache) {
    console.warn('[ProviderConfig] Provider cache not initialized, call fetchProviderConfigs first');
    return undefined;
  }

  return providerCache.get(provider);
}

/**
 * Get all cached provider configurations
 */
export function getAllProviderConfigs(): ProviderConfig[] {
  if (!providerCache) {
    return [];
  }

  return Array.from(providerCache.values());
}

/**
 * Get hardcoded default providers (used as fallback)
 * These should match the server-side defaults in db.ts
 */
function getDefaultProviders(): Map<string, ProviderConfig> {
  const defaults = new Map<string, ProviderConfig>();

  defaults.set('tfreeca', {
    provider: 'tfreeca',
    base_url: 'https://www.tfreeca22.top',
    description: 'Korean torrent site (tfreeca)'
  });

  defaults.set('torrenttip', {
    provider: 'torrenttip',
    base_url: 'https://torrenttip246.top',
    description: 'Korean torrent site (TorrentTip)'
  });

  providerCache = defaults;
  console.log('[ProviderConfig] Using hardcoded default providers');

  return defaults;
}

/**
 * Clear provider cache
 */
export function clearProviderCache(): void {
  providerCache = null;
}
