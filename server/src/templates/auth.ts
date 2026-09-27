/**
 * Authentication page templates
 */

interface LoginFormOptions {
  hasError?: boolean;
}

/**
 * Render login form
 */
export function renderLoginForm({ hasError = false }: LoginFormOptions = {}): string {
  return `<!DOCTYPE html>
<html>
<head>
<title>Admin Page - Login</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }
form { display: flex; flex-direction: column; gap: 10px; }
input { padding: 8px; font-size: 14px; }
button { padding: 10px; font-size: 14px; background-color: #007acc; color: white; border: none; cursor: pointer; border-radius: 4px; }
button:hover { background-color: #005a9e; }
.error { color: #d13438; margin-bottom: 10px; }
</style>
</head>
<body>
<h1>Admin Page</h1>
${hasError ? '<p class="error">Invalid API key. Please try again:</p>' : '<p>Please enter your API key to view the admin page:</p>'}
<form method="POST" action="/login">
<input type="password" name="apiKey" placeholder="API Key" required autofocus />
<button type="submit">Login</button>
</form>
</body>
</html>`;
}
