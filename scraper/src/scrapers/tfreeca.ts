import { load } from "cheerio";
import { getHttpClient } from "../utils/http.js";
import type { ScrapeTarget } from "../types/scraper.js";
import { IngestEntrySchema } from "../../../shared/schemas.js";
import type { IngestEntry } from "../../../shared/types.js";
import { downloadAndExtractMagnet } from "../utils/torrent.js";
import { isProcessed, markProcessed } from "../utils/cache.js";

/**
 * tfreeca scraper implementation with idempotent processing.
 *
 * Verified HTML Structure (as of 2026-09-29):
 * - Listing page shows best-of sections and main post list
 * - Posts are links with pattern: /board.php?mode=view&b_id=tdrama&id={id}&time={time}
 * - Detail page contains .torrent file link on external service (FileTender)
 *
 * Processing Flow:
 * 1. Extract post ID from detail URL (id={postNumber})
 * 2. Check cache: skip if already processed
 * 3. Fetch detail page
 * 4. Download .torrent file from FileTender
 * 5. Extract magnet link from .torrent
 * 6. Validate and return IngestEntry with magnet link
 * 7. Mark post as processed (after successful server ingestion)
 *
 * Note: We track processed posts locally in scraper/data/processed_ids.json
 * to avoid re-processing. Server handles final deduplication by id field.
 */

const SELECTORS = {
  // Selector for post rows in best-of and listing tables
  postRow: "table tr",

  // Selector for the post title link (usually in 2nd cell)
  postLink: "td:nth-child(2) a, td a:not(.menu-link)",

  // Base URL for resolving relative links
  baseUrl: "https://www.tfreeca22.top/",

  // Selector for torrent file link on detail page
  // tfreeca hosts torrent files on external services (FileTender)
  torrentLink: "a[href*='filetender']",

  // Fallback: search/redirect link if torrent link not found
  fallbackLink: "a[href*='bogotv2.store']",
};

/**
 * Extract post ID from tfreeca detail URL.
 * Format: /board.php?mode=view&b_id=tdrama&id={postNumber}&time={timestamp}
 * We extract the {postNumber} to create unique identifier: tfreeca-{postNumber}
 */
function extractPostId(detailUrl: string): string | null {
  const idMatch = detailUrl.match(/[?&]id=(\d+)/);
  return idMatch ? `tfreeca-${idMatch[1]}` : null;
}

/**
 * Scrapes a tfreeca target and returns a list of IngestEntry objects.
 * Processes only new posts (idempotent).
 *
 * @param target - The ScrapeTarget configuration
 * @param userAgent - Optional User-Agent string for HTTP requests
 * @returns Array of validated IngestEntry objects with magnet links
 * @throws Error if scraping fails
 */
export async function scrapeTarget(
  target: ScrapeTarget,
  userAgent?: string
): Promise<IngestEntry[]> {
  const httpClient = getHttpClient(userAgent);
  const entries: IngestEntry[] = [];
  const failedPosts: string[] = [];
  let skippedCount = 0;

  try {
    // Fetch listing page
    console.log(`[${target.name}] Fetching listing page: ${target.url}`);
    const listingHtml = await httpClient.fetchHtml(target.url);
    const $ = load(listingHtml);

    // Extract all post rows from the listing
    const postRows = $(SELECTORS.postRow);
    console.log(`[${target.name}] Found ${postRows.length} potential row elements`);

    // Process each post
    let rowCount = 0;
    for (let i = 0; i < postRows.length; i++) {
      const row = postRows.eq(i);
      const postLink = row.find(SELECTORS.postLink);

      if (postLink.length === 0) {
        continue; // Skip rows without links
      }

      const title = postLink.text().trim();
      const detailUrl = postLink.attr("href");

      if (!title || !detailUrl) {
        continue; // Skip incomplete entries
      }

      rowCount++;

      // Construct absolute detail URL if needed
      const absoluteDetailUrl = detailUrl.startsWith("http")
        ? detailUrl
        : new URL(detailUrl, SELECTORS.baseUrl).href;

      // Extract post ID for idempotency
      const postId = extractPostId(absoluteDetailUrl);
      if (!postId) {
        console.warn(
          `[${target.name}] Post "${title}": Could not extract post ID from URL`
        );
        failedPosts.push(`"${title}": No post ID`);
        continue;
      }

      // Check if already processed
      if (isProcessed(postId)) {
        console.log(`[${target.name}] ⊘ Skipped (already processed): "${title.substring(0, 50)}..."`);
        skippedCount++;
        continue;
      }

      console.log(
        `[${target.name}] Processing post ${rowCount}: "${title.substring(0, 50)}..." (ID: ${postId})`
      );

      try {
        // Fetch detail page
        const detailHtml = await httpClient.fetchHtml(absoluteDetailUrl);
        const $detail = load(detailHtml);

        // Try to extract torrent file link (primary)
        let torrentUrl = $detail(SELECTORS.torrentLink).first().attr("href");

        // Fallback to search/redirect link if no torrent found
        if (!torrentUrl) {
          torrentUrl = $detail(SELECTORS.fallbackLink).first().attr("href");
        }

        if (!torrentUrl) {
          console.warn(
            `[${target.name}] Post "${title}": No torrent link found on detail page`
          );
          failedPosts.push(`"${title}": No torrent link`);
          continue;
        }

        console.log(`[${target.name}] Downloading .torrent from: ${torrentUrl.substring(0, 50)}...`);

        // Download .torrent and extract magnet link
        const magnetUrl = await downloadAndExtractMagnet(torrentUrl);

        // Create IngestEntry with magnet URL and unique ID
        const entry: IngestEntry = {
          id: postId, // Unique ID for deduplication on server
          title,
          magnet_url: magnetUrl,
          category: target.category,
          published_at: new Date().toISOString(),
        };

        // Validate against schema
        const validatedEntry = IngestEntrySchema.parse(entry);
        entries.push(validatedEntry);
        
        // Mark as processed after successful validation
        markProcessed(postId);
        
        console.log(
          `[${target.name}] ✓ Extracted: "${title.substring(0, 40)}..." → magnet link extracted`
        );
      } catch (err) {
        const error = err as any;
        console.error(
          `[${target.name}] Error processing post "${title}":`,
          error.message
        );
        failedPosts.push(`"${title}": ${error.message}`);
      }
    }

    console.log(
      `[${target.name}] Summary: ${entries.length} new, ${skippedCount} skipped, ${failedPosts.length} failed`
    );
    if (failedPosts.length > 0 && failedPosts.length <= 5) {
      console.log(`[${target.name}] Failed posts:`, failedPosts);
    }
  } catch (err) {
    const error = err as any;
    console.error(`[${target.name}] Scraping failed:`, error.message);
    throw new Error(`Failed to scrape ${target.name}: ${error.message}`);
  }

  return entries;
}
