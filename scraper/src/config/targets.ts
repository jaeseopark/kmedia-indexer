import type { ScrapeTarget } from "../types/scraper.js";

/**
 * List of tfreeca board targets to scrape.
 * Each target represents a different category of content on tfreeca.
 * 
 * Base URL: https://www.tfreeca22.top/board.php
 * URL structure: ?mode={mode}&b_id={board_id}
 * 
 * Common board IDs:
 * - tdrama: K-drama torrents
 * - tent: Game shows / Entertainment content
 * - (expandable as new board IDs are discovered)
 */
export const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    name: "tfreeca-drama",
    provider: "tfreeca",
    url: "https://www.tfreeca22.top/board.php?mode=lists&b_id=tdrama",
    category: "5000",
    description: "K-drama and Korean drama series",
  },
  {
    name: "tfreeca-entertainment",
    provider: "tfreeca",
    url: "https://www.tfreeca22.top/board.php?mode=list&b_id=tent",
    category: "5000",
    description: "Korean variety shows and entertainment",
  },
];
