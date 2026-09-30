/**
 * Torrent file download and magnet extraction utility.
 * Downloads .torrent files and extracts magnet links for ingestion.
 */

import axios from "axios";
import parseTorrent from "parse-torrent";

/**
 * Download a .torrent file and extract its magnet link.
 * Falls back to torrent URL if magnet extraction fails.
 *
 * Attempts multiple strategies to bypass anti-bot protection:
 * 1. Realistic browser headers (User-Agent, Accept, Accept-Language, etc.)
 * 2. Standard browser cache control headers
 * 3. Connection and encoding preferences
 *
 * @param torrentUrl URL to the .torrent file
 * @returns Magnet link or fallback torrent URL
 * @throws Error if download fails completely
 */
export async function downloadAndExtractMagnet(torrentUrl: string): Promise<string> {
  try {
    // Realistic browser headers to bypass anti-bot detection
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "application/octet-stream, */*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Cache-Control": "max-age=0",
      "Pragma": "no-cache",
      "DNT": "1",
    };

    // Download the .torrent file
    const response = await axios.get(torrentUrl, {
      responseType: "arraybuffer",
      timeout: 10000,
      headers,
    });

    const torrentBuffer = Buffer.from(response.data);

    // Parse torrent file
    const torrent = await parseTorrent(torrentBuffer);

    // Extract magnet link
    const magnetLink = parseTorrent.toMagnetURI(torrent);

    if (!magnetLink) {
      console.warn(
        `[Torrent] Failed to generate magnet from ${torrentUrl}, falling back to torrent URL`
      );
      return torrentUrl;
    }

    console.log(`[Torrent] ✓ Extracted magnet from ${torrentUrl.substring(0, 50)}...`);
    return magnetLink;
  } catch (err) {
    const error = err as any;
    console.warn(
      `[Torrent] Failed to download/parse torrent (${error.message}), using torrent URL as fallback`
    );
    // Return the torrent URL as fallback - most torrent clients can handle direct .torrent URLs
    return torrentUrl;
  }
}
