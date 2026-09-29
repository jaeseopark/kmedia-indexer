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
  {
    name: "torrenttip-movies",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/1",
    category: "1000",
    description: "Movies",
  },
  {
    name: "torrenttip-drama",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/2",
    category: "5000",
    description: "Drama series",
  },
  {
    name: "torrenttip-netflix",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/3",
    category: "5000",
    description: "Netflix content",
  },
  {
    name: "torrenttip-video-music",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/4/16",
    category: "4000",
    description: "Videos and Music",
  },
  {
    name: "torrenttip-anime",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/5",
    category: "3000",
    description: "Anime and Manga",
  },
  {
    name: "torrenttip-games",
    provider: "torrenttip",
    url: "https://torrenttip246.top/c/6",
    category: "6000",
    description: "Games and Utilities",
  },
];
