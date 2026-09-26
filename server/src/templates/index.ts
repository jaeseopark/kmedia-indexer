/**
 * Index page template with health stats and ingest form
 */

interface HealthStats {
  count: number;
  titles: string[];
}

interface IndexPageOptions {
  stats: HealthStats;
}

interface HealthContentOptions {
  stats: HealthStats;
}

/**
 * Render index page with health stats and ingest form
 */
export function renderIndexPage({ stats }: IndexPageOptions): string {
  const healthContent = composeHealthContent({ stats });
  const ingestForm = composeIngestForm();

  return `<!DOCTYPE html>
<html>
<head>
<title>App Health</title>
<style>
${getBaseStyles()}
</style>
<script>
${getIngestFormScript()}
</script>
</head>
<body>
<h1>App Health</h1>
<pre>${healthContent}</pre>
<h2>Ingest Record</h2>
<div id="ingest-message"></div>
${ingestForm}
<hr />
<p><a href="/logout">Logout</a></p>
</body>
</html>`;
}

/**
 * Compose health stats text content
 */
function composeHealthContent({ stats }: HealthContentOptions): string {
  let content = 'APP HEALTH\n\n';
  content += 'Records in last 24 hours: ' + stats.count + '\n';
  
  if (stats.count === 0) {
    content += 'No records in the last 24 hours\n';
  } else {
    content += '\nLatest titles:\n';
    stats.titles.forEach((title, index) => {
      content += (index + 1) + '. ' + title + '\n';
    });
  }
  
  return content;
}

/**
 * Compose ingest form HTML (single entry)
 */
function composeIngestForm(): string {
  return `<form id="ingest-form" onsubmit="submitIngest(event)">
  <div class="form-group">
    <label style="margin-bottom: 3px;">Title <span style="color: red;">*</span></label>
    <input type="text" id="entry-title" placeholder="Torrent title" required />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Magnet URL <span style="color: red;">*</span></label>
    <input type="text" id="entry-magnet" placeholder="magnet:?xt=urn:btih:..." required />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Category</label>
    <input type="text" id="entry-category" value="2000" placeholder="2000 (Movies) or 5000 (TV)" />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Size (bytes)</label>
    <input type="number" id="entry-size" value="0" placeholder="0" />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Seeders</label>
    <input type="number" id="entry-seeders" value="0" placeholder="0" />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Leechers</label>
    <input type="number" id="entry-leechers" value="0" placeholder="0" />
  </div>
  <div class="form-group">
    <label style="margin-bottom: 3px;">Published Date (ISO 8601)</label>
    <input type="text" id="entry-published" placeholder="2024-01-15T10:30:00Z" />
  </div>
  <button type="submit">Submit Ingest</button>
</form>`;
}

/**
 * Get base styles for the page
 */
function getBaseStyles(): string {
  return `
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 900px; margin: 20px auto; padding: 20px; }
h1 { margin-top: 0; }
h2 { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; }
a { color: #007acc; text-decoration: none; }
a:hover { text-decoration: underline; }
input[type="number"], input[type="text"] { padding: 6px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; width: 100%; box-sizing: border-box; }
button { padding: 10px 20px; font-size: 14px; background-color: #007acc; color: white; border: none; cursor: pointer; border-radius: 4px; margin-top: 10px; }
button:hover { background-color: #005a9e; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
.success { color: #107c10; background-color: #f1f5f9; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
.error { color: #d13438; background-color: #f1f5f9; padding: 10px; border-radius: 4px; margin-bottom: 20px; }
  `;
}

/**
 * Get ingest form JavaScript (single entry submission)
 */
function getIngestFormScript(): string {
  return `
async function submitIngest(e) {
  e.preventDefault();
  const title = document.getElementById("entry-title").value.trim();
  const magnet_url = document.getElementById("entry-magnet").value.trim();
  const category = document.getElementById("entry-category").value.trim() || "2000";
  const size_bytes = parseInt(document.getElementById("entry-size").value) || 0;
  const seeders = parseInt(document.getElementById("entry-seeders").value) || 0;
  const leechers = parseInt(document.getElementById("entry-leechers").value) || 0;
  const published_at = document.getElementById("entry-published").value.trim();
  
  if (!title || !magnet_url) {
    alert("Title and Magnet URL are required");
    return;
  }
  
  const msgEl = document.getElementById("ingest-message");
  try {
    msgEl.textContent = "Submitting...";
    msgEl.className = "";
    const response = await fetch("/api/v1/ingest", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({entries: [{title, magnet_url, category, size_bytes, seeders, leechers, published_at: published_at || undefined}]})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Submission failed");
    msgEl.textContent = "Success! Record ingested";
    msgEl.className = "success";
    document.getElementById("ingest-form").reset();
  } catch (err) {
    msgEl.textContent = "Error: " + err.message;
    msgEl.className = "error";
  }
}
  `;
}
