/**
 * Maps tfreeca board IDs (b_id URL parameter) to media category codes.
 * Used for routing different tfreeca content types to the appropriate media category.
 *
 * Category codes:
 * - "2000": Movies
 * - "5000": TV Shows / Series
 */

export const CATEGORY_MAP: Record<string, "2000" | "5000"> = {
  tdrama: "5000",    // K-drama series
  tent: "5000",      // Entertainment shows
  tgame: "5000",     // Game show reruns
  // Expandable: add new board IDs as they are discovered
};

/**
 * Extracts the board ID from a tfreeca URL and returns its category.
 * Falls back to "5000" (TV) if board ID is unknown.
 *
 * @example
 * getCategoryFromUrl("https://www.tfreeca22.top/board.php?mode=lists&b_id=tdrama")
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
