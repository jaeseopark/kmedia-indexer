/**
 * Local cache for tracking processed post IDs.
 * Enables idempotent scraping - avoids re-processing posts.
 */

import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(import.meta.dirname, "../..", "data");
const CACHE_FILE = path.join(CACHE_DIR, "processed_ids.json");

interface CacheFile {
  processedIds: string[];
  lastUpdated: string;
}

let cachedIds: Set<string> | null = null;
let lastUpdated: string = "";

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Load processed IDs from disk
 */
function loadCache(): Set<string> {
  try {
    ensureCacheDir();
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, "utf-8");
      const parsed = JSON.parse(data) as CacheFile;
      return new Set(parsed.processedIds || []);
    }
  } catch (err) {
    console.warn("[Cache] Failed to load cache file, starting fresh");
  }
  return new Set();
}

/**
 * Save processed IDs to disk
 */
function saveCache(ids: Set<string>): void {
  try {
    ensureCacheDir();
    const data: CacheFile = {
      processedIds: Array.from(ids),
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2));
    lastUpdated = data.lastUpdated;
  } catch (err) {
    console.warn("[Cache] Failed to save cache file");
  }
}

/**
 * Check if a post ID has already been processed
 */
export function isProcessed(postId: string): boolean {
  if (!cachedIds) {
    cachedIds = loadCache();
  }
  return cachedIds.has(postId);
}

/**
 * Mark a post ID as processed
 */
export function markProcessed(postId: string): void {
  if (!cachedIds) {
    cachedIds = loadCache();
  }
  cachedIds.add(postId);
  saveCache(cachedIds);
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { count: number; lastUpdated: string } {
  if (!cachedIds) {
    cachedIds = loadCache();
  }
  return {
    count: cachedIds.size,
    lastUpdated: lastUpdated || new Date().toISOString(),
  };
}

/**
 * Clear cache (for testing)
 */
export function clearCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
  } catch (err) {
    console.warn("[Cache] Failed to clear cache");
  }
  cachedIds = null;
}
