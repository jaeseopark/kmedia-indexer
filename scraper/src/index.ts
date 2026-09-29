import "dotenv/config";
import axios from "axios";
import { SCRAPE_TARGETS } from "./config/targets.js";
import { scrapeTarget } from "./scrapers/tfreeca.js";
import type { IngestEntry } from "../../shared/types.js";

/**
 * Environment variables
 */
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";
const INGEST_API_KEY = process.env.INGEST_API_KEY;
const SCRAPER_USER_AGENT =
  process.env.SCRAPER_USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Validates required environment variables
 */
function validateEnv(): void {
  const errors: string[] = [];

  if (!SERVER_URL) {
    errors.push("SERVER_URL is not set");
  }

  if (!INGEST_API_KEY) {
    errors.push("INGEST_API_KEY is not set");
  }

  if (errors.length > 0) {
    console.error("❌ Configuration errors:");
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error("\n📋 See .env.example for required variables");
    process.exit(1);
  }
}

/**
 * Posts ingested entries to the server's ingest endpoint
 *
 * @param entries - Array of IngestEntry objects to post
 * @returns Response data from server
 * @throws Error if POST fails
 */
async function postToServer(entries: IngestEntry[]): Promise<any> {
  if (entries.length === 0) {
    console.log("ℹ️  No entries to post");
    return { success: true, count: 0, created: 0, updated: 0 };
  }

  try {
    const response = await axios.post(
      `${SERVER_URL}/api/v1/ingest`,
      { entries },
      {
        headers: {
          Authorization: `Bearer ${INGEST_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log(
      `✓ Server response: ${response.data.count} ingested (${response.data.created} new, ${response.data.updated} updated)`
    );
    return response.data;
  } catch (err) {
    const error = err as any;
    if (error.response?.status === 401 || error.response?.status === 403) {
      throw new Error(
        `Authentication failed (HTTP ${error.response.status}): Check INGEST_API_KEY`
      );
    }
    throw new Error(
      `Server error: ${error.response?.statusText || error.message}`
    );
  }
}

/**
 * Main scraper orchestrator
 * Iterates through all targets, scrapes them, and posts results to server
 */
async function runScraper(): Promise<void> {
  console.log("🚀 Starting kmedia-indexer scraper");
  console.log(`📍 Server: ${SERVER_URL}`);
  console.log(`🎯 Targets: ${SCRAPE_TARGETS.length}\n`);

  let totalEntries = 0;
  let successfulTargets = 0;
  const failedTargets: string[] = [];

  // Process each target
  for (const target of SCRAPE_TARGETS) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📦 Target: ${target.name}`);
    console.log(`   URL: ${target.url}`);
    console.log(`   Category: ${target.category}`);
    console.log(`${"=".repeat(60)}`);

    try {
      // Scrape the target
      const entries = await scrapeTarget(target, SCRAPER_USER_AGENT);
      totalEntries += entries.length;

      if (entries.length > 0) {
        // Post to server
        await postToServer(entries);
        successfulTargets++;
      } else {
        console.log(`⚠️  No entries scraped for ${target.name}`);
        successfulTargets++;
      }
    } catch (err) {
      const error = err as any;
      console.error(`❌ Failed to process ${target.name}:`, error.message);
      failedTargets.push(target.name);
    }
  }

  // Summary
  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Scraper Summary");
  console.log(`${"=".repeat(60)}`);
  console.log(`✓ Successful targets: ${successfulTargets}/${SCRAPE_TARGETS.length}`);
  console.log(`✓ Total entries processed: ${totalEntries}`);

  if (failedTargets.length > 0) {
    console.log(`❌ Failed targets: ${failedTargets.join(", ")}`);
    process.exit(1);
  } else {
    console.log("✅ All targets completed successfully");
    process.exit(0);
  }
}

// Entry point
validateEnv();
runScraper().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
