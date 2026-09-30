/**
 * Media Analyzer Utility
 * Shared across all scrapers to analyze media titles and determine category codes
 */

export interface MediaInfo {
  resolution: string;
  releaseType: string;
}

/**
 * Input type for getCategoryCode - combines media info with content type
 */
export type CategoryCodeInput = MediaInfo & { contentType: string };

export interface CategoryMapping {
  resolution: string;
  releaseType: string;
  contentType: string;
  category: string;
}

/**
 * Regex patterns for resolution detection
 */
const RESOLUTION_PATTERNS: Record<string, RegExp[]> = {
  '2160p': [/2160p|4k|uhd/i],
  '1080p': [/1080p|full\s*hd|fhd/i],
  '720p': [/720p|hd(?!rip)/i],
  'sd': [/480p|360p|576p/i],
};

/**
 * Regex patterns for release type detection
 */
const RELEASE_TYPE_PATTERNS: Record<string, RegExp[]> = {
  'webrip': [/webrip|web-rip|web\s*rip/i],
  'webdl': [/web-?dl|web\s*dl|web.*download/i],
  'bluray': [/bluray|blu-ray|b-ray|bdrip|bd-rip/i],
  'dvdrip': [/dvdrip|dvd-rip|dvd\s*rip/i],
  'hdtv': [/hdtv/i],
  'brrip': [/brrip|br-rip|br\s*rip/i],
  'unknown': [],
};

/**
 * Analyze media title and extract resolution and release type
 * @param title Post title from scraper
 * @returns Object with resolution and releaseType (never falsy)
 */
export function analyzeMediaTitle(title: string): MediaInfo {
  // Detect resolution
  let resolution = 'sd'; // Default to SD

  for (const [res, patterns] of Object.entries(RESOLUTION_PATTERNS)) {
    if (patterns.some(pattern => pattern.test(title))) {
      resolution = res;
      break;
    }
  }

  // Detect release type
  let releaseType = 'unknown'; // Default to unknown

  for (const [type, patterns] of Object.entries(RELEASE_TYPE_PATTERNS)) {
    if (type !== 'unknown' && patterns.some(pattern => pattern.test(title))) {
      releaseType = type;
      break;
    }
  }

  return {
    resolution,
    releaseType,
  };
}

/**
 * Map media info + content type to Newznab category code
 * Returns appropriate Prowlarr/Newznab category code with defaults
 *
 * Newznab TV Categories:
 * 5000  = TV (General/Default)
 * 5010  = TV/WEB-DL
 * 5020  = TV/Foreign
 * 5030  = TV/SD
 * 5040  = TV/HD
 * 5045  = TV/UHD
 * 5050  = TV/Other
 * 5060  = TV/Sport
 * 5070  = TV/Anime
 * 5080  = TV/Documentary
 *
 * @param input Combined media info and content type
 * @returns Category code (never falsy, defaults to 5000)
 */
export function getCategoryCode(input: CategoryCodeInput): string {
  const { resolution, releaseType, contentType } = input;
  const contentTypeLower = contentType.toLowerCase();

  // Handle special content types first
  if (contentTypeLower.includes('anime')) {
    return '5070'; // TV/Anime
  }

  if (contentTypeLower.includes('documentary') || contentTypeLower.includes('docuseries')) {
    return '5080'; // TV/Documentary
  }

  if (contentTypeLower.includes('sport') || contentTypeLower.includes('sports')) {
    return '5060'; // TV/Sport
  }

  // Handle release type based routing
  if (releaseType === 'webdl') {
    return '5010'; // TV/WEB-DL
  }

  // Handle resolution based routing (for regular TV content)
  if (resolution === '2160p') {
    return '5045'; // TV/UHD
  }

  if (resolution === '1080p' || resolution === '720p') {
    return '5040'; // TV/HD
  }

  if (resolution === 'sd') {
    return '5030'; // TV/SD
  }

  // Default fallback
  return '5000'; // TV (General)
}
