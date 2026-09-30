const API_BASE = '';

export interface ApiError {
  error: string;
  details?: unknown;
}

export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as ApiError;
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export async function loginWithApiKey(apiKey: string): Promise<void> {
  const params = new URLSearchParams();
  params.append('apiKey', apiKey);

  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    if (text.includes('hasError')) {
      throw new Error('Invalid API key');
    }
    throw new Error(`Login failed: ${response.status}`);
  }

  window.location.href = '/';
}

export function logout(): void {
  window.location.href = '/logout';
}
