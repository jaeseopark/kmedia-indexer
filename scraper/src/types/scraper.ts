/**
 * ScrapeTarget defines a URL and configuration for a scraping job.
 * Supports configurable target URLs with category mapping.
 */
export interface ScrapeTarget {
  /** Unique identifier for this target (e.g., "tfreeca-drama") */
  name: string;

  /** Provider identifier (e.g., "tfreeca", "torrenttip") for routing to correct scraper */
  provider: "tfreeca" | "torrenttip" | "generic";

  /** Full URL to scrape */
  url: string;

  /** Category code to assign all extracted entries ("1000" = Movies, "3000" = Anime, "4000" = Music/Video, "5000" = TV/Drama, "6000" = Games) */
  category: "1000" | "2000" | "3000" | "4000" | "5000" | "6000";

  /** Optional description of the target's content */
  description?: string;
}
