import axios, { type AxiosInstance } from "axios";

/**
 * HTTP client for fetching web pages.
 * Provides retry logic, custom headers, and error handling.
 */
export class HttpClient {
  private client: AxiosInstance;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;

  constructor(userAgent?: string) {
    this.client = axios.create({
      timeout: 10000, // 10 second timeout
      headers: {
        "User-Agent":
          userAgent ||
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
  }

  /**
   * Fetch HTML content from a URL with retry logic.
   * Retries on network errors or 5xx server errors.
   * Throws on 4xx errors (which indicate a permanent issue).
   *
   * @param url - URL to fetch
   * @returns HTML content as string
   * @throws Error with descriptive message on failure
   */
  async fetchHtml(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.get(url);
        return response.data;
      } catch (err) {
        const error = err as any;
        lastError = new Error(
          `Attempt ${attempt}/${this.maxRetries} failed: ${error.message}`
        );

        // Don't retry on client errors (4xx)
        if (error.response?.status && error.response.status < 500) {
          throw new Error(
            `HTTP ${error.response.status} ${error.response.statusText} for ${url}`
          );
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelayMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to fetch ${url} after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }
}

/**
 * Creates a singleton HTTP client instance.
 * Reuses the same client across all requests for connection pooling.
 */
let httpClientInstance: HttpClient | null = null;

export function getHttpClient(userAgent?: string): HttpClient {
  if (!httpClientInstance) {
    httpClientInstance = new HttpClient(userAgent);
  }
  return httpClientInstance;
}
