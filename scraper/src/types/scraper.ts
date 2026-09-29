/**
 * ScrapeTarget defines a URL and configuration for a scraping job.
 * Supports configurable target URLs with category mapping.
 */
export interface ScrapeTarget {
  /** Unique identifier for this target (e.g., "tfreeca-drama") */
  name: string;

  /** Provider identifier (e.g., "tfreeca") for future multi-provider support */
  provider: "tfreeca" | "generic";

  /** Full URL to scrape */
  url: string;

  /** Category code to assign all extracted entries ("2000" = Movies, "5000" = TV) */
  category: "2000" | "5000";

  /** Optional description of the target's content */
  description?: string;
}
