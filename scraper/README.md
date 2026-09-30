# Scraper

TypeScript-based web scraper for extracting torrent metadata from torrent sites and ingesting into kmedia-indexer.

## Quick Start

### Prerequisites
- Node.js 26.0.0 or later
- Running kmedia-indexer server instance
- Valid `INGEST_API_KEY` from server

### Installation

```bash
cd scraper
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev
```

Watches source files and re-runs on changes.

### Production

```bash
npm run build
npm start
```

## Configuration

Edit `.env` file (created from `.env.example`):

```env
# Server endpoint
SERVER_URL=http://localhost:3000

# Authentication token from server (INGEST_API_KEY env var)
INGEST_API_KEY=your_token_here

# HTTP User-Agent (helps avoid blocking)
SCRAPER_USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...

# Log level
LOG_LEVEL=info
```

### Adding New Targets

Edit `src/config/targets.ts` to add new provider URLs:

```typescript
export const SCRAPE_TARGETS: ScrapeTarget[] = [
  {
    name: "my-new-target",
    provider: "torrenttip",
    path: "/c/2",
    category: "5000", // "2000" for movies, "5000" for TV
    description: "My custom content",
  },
  // ... other targets
];
```

Then update category mapping in `src/config/categories.ts`:

```typescript
export const CATEGORY_MAP: Record<string, "2000" | "5000"> = {
  myid: "5000",
  // ... other mappings
};
```

## Architecture

### How It Works

1. **Load Configuration**: Read targets from `src/config/targets.ts`
2. **Fetch Listing Page**: HTTP GET each target URL, parse HTML with cheerio
3. **Extract Posts**: Identify post rows in table, extract title and detail page link
4. **Fetch Detail Page**: For each post, GET the detail page
5. **Extract External Link**: Parse detail page to find magnet URL or torrent link
6. **Validate**: Check each extracted entry against `IngestEntry` schema
7. **Post to Server**: Send batch of `IngestEntry` objects to `/api/v1/ingest` endpoint
8. **Report**: Log results and exit with appropriate status code

### Request Flow

```
Scraper                    Server
  |                          |
  +------ GET listing ------>|
  |<----- HTML page ---------|
  |
  +--- GET detail page ------->|
  |<---- HTML page ------------|
  |
  +-- POST /api/v1/ingest ----->|
  |   { entries: [...] }        |
  |<--- {success, count} -------|
```

### Components

| File | Purpose |
|------|---------|
| `src/index.ts` | Main orchestrator, environment validation, server posting |
| `src/scrapers/tfreeca.ts` | tfreeca-specific HTML parsing logic |
| `src/utils/http.ts` | HTTP client with retry logic |
| `src/config/targets.ts` | List of URLs to scrape |
| `src/config/categories.ts` | URL board ID → category mapping |
| `src/types/scraper.ts` | TypeScript types (ScrapeTarget) |

## HTML Structure

The scraper uses CSS selectors to parse tfreeca HTML. Current selectors:

```typescript
// File: src/scrapers/tfreeca.ts
const SELECTORS = {
  postRow: "table tbody tr",           // Post rows in listing
  titleCell: "td:nth-child(2) a",      // Post title link in 2nd cell
  externalLink: "a[href*='magnet:']",  // Magnet link on detail page
};
```

### Adjusting Selectors

If scraping fails, the selectors may need updating. To fix:

1. Open tfreeca URL in browser
2. Inspect HTML structure of post rows and detail pages
3. Update `SELECTORS` object in `src/scrapers/tfreeca.ts`
4. Re-run scraper and verify with `npm run dev`

Example adjustment:
```typescript
// Before (incorrect)
titleCell: "td:nth-child(2) a"

// After (correct, if title is in 3rd cell)
titleCell: "td:nth-child(3) a"
```

## Data Flow

### Input: tfreeca webpage
```html
<table>
  <tbody>
    <tr>
      <td>1</td>
      <td><a href="board.php?mode=view&b_id=tdrama&num=12345">Korean Drama Title</a></td>
      ...
    </tr>
  </tbody>
</table>
```

### Processing: Extract and validate
```javascript
{
  title: "Korean Drama Title",
  magnet_url: "magnet:?xt=urn:btih:...",
  category: "5000",
  published_at: "2026-01-15T10:30:00Z"
}
```

### Output: POST to server
```bash
POST /api/v1/ingest HTTP/1.1
Authorization: Bearer token
Content-Type: application/json

{
  "entries": [
    {
      "title": "Korean Drama Title",
      "magnet_url": "magnet:?xt=urn:btih:...",
      "category": "5000",
      "published_at": "2026-01-15T10:30:00Z"
    }
  ]
}

HTTP/1.1 200 OK
{
  "success": true,
  "count": 1,
  "created": 1,
  "updated": 0
}
```

## Error Handling

### HTTP Errors
- **Retries**: Network errors trigger exponential backoff (up to 3 attempts)
- **4xx**: Client errors (bad URL, 403 Forbidden) fail immediately
- **5xx**: Server errors retry with backoff

### Authentication
- **401/403**: Invalid API key — check `INGEST_API_KEY` env var
- **Header check**: Verify `Authorization: Bearer` is sent correctly

### Parsing Errors
- **No posts found**: HTML structure may have changed, update `SELECTORS`
- **No magnet URL**: Detail page structure may differ, check selectors
- **Validation errors**: Entry missing required fields (title, magnet_url)

### Debugging

Enable detailed logs by creating a simple debug script:

```typescript
// debug.ts
import { scrapeTarget } from "./src/scrapers/tfreeca.js";
import { SCRAPE_TARGETS } from "./src/config/targets.js";

const target = SCRAPE_TARGETS[0];
scrapeTarget(target)
  .then(entries => console.log(JSON.stringify(entries, null, 2)))
  .catch(err => console.error(err));
```

Run with: `npx tsx debug.ts`

## Scheduling

### Single Run (Recommended for MVP)
```bash
# Runs scraper once and exits
npm start
```

Use external scheduler:
- **Cron** (Linux/Mac):
  ```bash
  # Every hour
  0 * * * * cd /path/to/scraper && npm start
  ```
- **Docker**: Run as Kubernetes CronJob
- **systemd timer**: Configure as timed service

### Persistent Service (Future)
Would require adding internal scheduling to `src/index.ts`:
```typescript
const interval = parseInt(process.env.SCRAPE_INTERVAL_MINUTES || "60") * 60 * 1000;
setInterval(runScraper, interval);
```

## Troubleshooting

### "Cloudflare is blocking requests"
**Error**: HTTP 403 or challenge page returned

**Solutions** (in order of preference):
1. Add `curl_cffi` Python library for TLS fingerprinting
2. Deploy Solvearr as HTTP proxy
3. Rotate User-Agent headers

See issue #12 for modern alternatives to FlareSolverr.

### "No entries extracted"
**Causes**:
1. HTML selectors don't match page structure
2. URL changed or domain is different
3. Site requires authentication

**Fix**:
1. Open URL manually, inspect HTML
2. Update `SELECTORS` in `src/scrapers/tfreeca.ts`
3. Check if site serves different HTML to scrapers (Cloudflare)

### "Connection timed out"
**Cause**: Server unreachable or slow network

**Fix**:
1. Verify `SERVER_URL` in `.env`
2. Check server is running: `curl http://localhost:3000/health`
3. Increase timeout in `src/utils/http.ts` if needed

### "Authentication failed"
**Cause**: Invalid or missing API key

**Fix**:
1. Generate new API key on server
2. Update `INGEST_API_KEY` in `.env`
3. Verify Bearer token format in `src/index.ts`

## Type Safety

The scraper imports types from `../shared/`:
- `IngestEntry`: Validated torrent record format
- `IngestEntrySchema`: Zod schema for runtime validation

All entries are validated before posting to ensure consistency.

## Development

### Build
```bash
npm run build    # TypeScript → dist/
npm run lint     # Type check without emitting
```

### Project Structure
```
scraper/
├── src/
│   ├── config/
│   │   ├── categories.ts    # URL → category mapping
│   │   └── targets.ts       # Scrape target list
│   ├── scrapers/
│   │   └── tfreeca.ts       # tfreeca parser logic
│   ├── types/
│   │   └── scraper.ts       # ScrapeTarget interface
│   ├── utils/
│   │   └── http.ts          # HTTP client
│   └── index.ts             # Main orchestrator
├── dist/                    # Compiled JavaScript (after build)
├── package.json
├── tsconfig.json
└── .env.example
```

## Future Enhancements

- [ ] Multi-provider support (other Korean torrent sites)
- [ ] Predicate-based category detection from page content
- [ ] Database-driven configuration UI
- [ ] Cloudflare bypass integration (curl_cffi or Solvearr)
- [ ] Incremental scraping (only new posts since last run)
- [ ] Web UI for managing targets
- [ ] Metrics/monitoring integration
