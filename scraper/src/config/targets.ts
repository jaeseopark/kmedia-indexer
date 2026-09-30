import type { ScrapeTarget } from "../types/scraper.js";

/**
 * Scraper targets configuration.
 * Base URLs are fetched from the server API; this config stores only the paths.
 * 
 * For torrenttip provider:
 * - Path format: /c/{category} or /c/{category}/{subcategory}
 */
export const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    name: "torrenttip-movies",
    provider: "torrenttip",
    path: "/c/1",
    category: "1000",
    contentType: "movies",
    description: "Movies",
  },
  {
    name: "torrenttip-drama",
    provider: "torrenttip",
    path: "/c/2",
    category: "5000",
    contentType: "drama",
    description: "Drama series",
  },
  {
    name: "torrenttip-video-music",
    provider: "torrenttip",
    path: "/c/4/16",
    category: "5000",
    contentType: "comedy",
    description: "Comedy shows",
  }
];
