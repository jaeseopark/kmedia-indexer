/**
 * TorrentTip scraper
 * Website: https://torrenttip246.top
 * Features:
 * - Multiple category pages (forums)
 * - Post listing with direct links
 * - Individual post pages expose magnet links directly
 * - No bot protection (unlike FileTender)
 */

import * as cheerio from 'cheerio';
import { isProcessed, markProcessed } from '../utils/cache.js';
import { getHttpClient } from '../utils/http.js';
import { analyzeMediaTitle, getCategoryCode } from '../utils/mediaAnalyzer.js';
import type { ScrapeTarget } from '../types/scraper.js';
import type { IngestEntry } from '../../../shared/types.js';

/**
 * Extract post ID from TorrentTip URL
 * URL format: https://torrenttip246.top/t/{POSTID}.html
 * ID format: torrenttip-{POSTID}
 */
export function extractPostId(postUrl: string): string {
  const match = postUrl.match(/\/t\/([a-zA-Z0-9]+)\.html/);
  if (!match) {
    throw new Error(`Could not extract post ID from URL: ${postUrl}`);
  }
  return `torrenttip-${match[1]}`;
}

/**
 * Fetch and parse individual post page to extract magnet link
 */
async function fetchPostDetails(postUrl: string, httpClient: any): Promise<string | null> {
  try {
    const html = await httpClient.fetchHtml(postUrl);
    const $ = cheerio.load(html);

    // Find magnet link: <a href="magnet:?xt=..." class="...">
    const magnetLink = $('a[href^="magnet:"]').first().attr('href');

    if (!magnetLink) {
      console.log(`[torrenttip] No magnet link found in post: ${postUrl}`);
      return null;
    }

    return magnetLink;
  } catch (err) {
    console.error(`[torrenttip] Failed to fetch post details from ${postUrl}:`, (err as any).message);
    return null;
  }
}

/**
 * Scrape TorrentTip forum and extract torrent metadata
 * Returns array of entries ready to post to server
 */
export async function scrapeTarget(target: ScrapeTarget & { url: string }, userAgent?: string): Promise<IngestEntry[]> {
  const httpClient = getHttpClient(userAgent);
  console.log(`[${target.name}] Starting scrape...`);

  const entries: IngestEntry[] = [];
  let skippedCount = 0;
  let newCount = 0;
  let failedCount = 0;

  try {
    // Fetch listing page
    console.log(`[${target.name}] Fetching listing page: ${target.url}`);
    const listingHtml = await httpClient.fetchHtml(target.url);
    const $ = cheerio.load(listingHtml);

    // Extract all post links from listing page
    // Selector: a.hover:text-red-500 with href="/t/{POSTID}.html"
    const postLinks = $('a.hover\\:text-red-500[href*="/t/"][href$=".html"]');

    console.log(`[${target.name}] Found ${postLinks.length} posts on listing page`);

    for (const element of postLinks) {
      const postUrl = $(element).attr('href');
      const postTitle = $(element).attr('title') || $(element).text().trim();

      if (!postUrl) {
        continue;
      }

      // Make absolute URL if needed
      const absolutePostUrl = postUrl.startsWith('http') ? postUrl : `https://torrenttip246.top${postUrl}`;

      try {
        // Extract post ID for idempotency check
        const postId = extractPostId(absolutePostUrl);

        // Skip if already processed
        if (isProcessed(postId)) {
          skippedCount++;
          continue;
        }

        // Fetch post details and extract magnet link
        const magnetUrl = await fetchPostDetails(absolutePostUrl, httpClient);

        if (!magnetUrl) {
          failedCount++;
          continue;
        }

        // Mark as processed before validation
        markProcessed(postId);

        // Analyze media title to extract resolution and release type
        const mediaInfo = analyzeMediaTitle(postTitle);

        // Determine category based on media info and content type
        const contentType = target.contentType || 'tv';
        const categoryCode = getCategoryCode({ ...mediaInfo, contentType });

        // Create entry for server
        // Note: seeders/leechers intentionally omitted since TorrentTip doesn't expose this info
        // Server will not include these in Torznab XML if missing, preventing Sonarr seed filters
        const entry: IngestEntry = {
          id: postId,
          title: postTitle,
          magnet_url: magnetUrl,
          category: categoryCode,
          published_at: new Date().toISOString(),
        };

        entries.push(entry);
        newCount++;

        // Rate limiting: wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (err) {
        console.error(`[${target.name}] Error processing post ${postUrl}:`, (err as any).message);
        failedCount++;
      }
    }

    console.log(
      `[${target.name}] ✓ Scrape complete: ${newCount} new, ${skippedCount} skipped, ${failedCount} failed`
    );
  } catch (err) {
    console.error(`[${target.name}] ✗ Scrape failed:`, (err as any).message);
    throw err;
  }

  return entries;
}
