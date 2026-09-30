/**
 * Maps board IDs to media category codes.
 * Used for routing different content types to the appropriate media category.
 *
 * Category codes:
 * - "2000": Movies
 * - "5000": TV Shows / Series
 */

export const CATEGORY_MAP: Record<string, "2000" | "5000"> = {
  // Expandable: add board IDs as they are discovered
};

/**
 * Returns the category for a given URL.
 * Falls back to "5000" (TV) if board ID is unknown.
 *
 * @example
 * getCategoryFromUrl("https://example.com/board.php?mode=lists&b_id=drama")
 * // Returns "5000"
 */
export function getCategoryFromUrl(url: string): "2000" | "5000" {
  try {
    const urlObj = new URL(url);
    const boardId = urlObj.searchParams.get("b_id");
    if (boardId && boardId in CATEGORY_MAP) {
      return CATEGORY_MAP[boardId];
    }
  } catch {
    // Invalid URL, fall through to default
  }
  // Default to TV category if board ID is unknown
  return "5000";
}
