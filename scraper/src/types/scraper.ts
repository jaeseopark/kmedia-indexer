/**
 * ScrapeTarget defines configuration for a scraping job.
 * Base URL is fetched from the server API; config stores only the path.
 */
export interface ScrapeTarget {
  /** Unique identifier for this target (e.g., "torrenttip-drama") */
  name: string;

  /** Provider identifier (e.g., "torrenttip") - used to fetch base_url from server API */
  provider: "torrenttip" | "generic";

  /** Path relative to provider's base URL (e.g., "/c/1" or "?mode=list&b_id=drama") */
  path: string;

  /** Full URL to scrape (built from provider base URL + path at runtime) */
  url?: string;

  /** Category code to assign all extracted entries ("1000" = Movies, "3000" = Anime, "4000" = Music/Video, "5000" = TV/Drama, "6000" = Games) */
  category: "1000" | "2000" | "3000" | "4000" | "5000" | "6000";

  /** Content type for dynamic category mapping (drama, anime, variety, sports, documentary, etc.) - used by media analyzer */
  contentType?: string;

  /** Optional description of the target's content */
  description?: string;
}
