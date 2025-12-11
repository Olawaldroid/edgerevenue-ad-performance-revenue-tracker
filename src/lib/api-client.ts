import { ApiResponse } from "../../shared/types"
import { toast } from "sonner";
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
export async function api<T>(path: string, init?: RequestInit, options: { retries?: number, timeout?: number } = {}): Promise<T> {
  const { retries = 3, timeout = 10000 } = options;
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(path, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init?.headers },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        // For 5xx errors, we retry
        if (res.status >= 500 && i < retries - 1) {
          await delay(100 * (i + 1)); // Exponential backoff
          continue;
        }
        // For other errors, we fail fast
        const json = (await res.json()) as ApiResponse<never>;
        const errorMessage = json.error || `Request failed with status ${res.status}`;
        console.error(`API Error on path ${path}:`, errorMessage);
        throw new Error(errorMessage);
      }
      const json = (await res.json()) as ApiResponse<T>;
      if (!json.success || json.data === undefined) {
        const errorMessage = json.error || 'API returned success=false without an error message.';
        console.error(`API Logic Error on path ${path}:`, errorMessage);
        throw new Error(errorMessage);
      }
      return json.data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`API request timed out: ${path}`);
        if (i < retries - 1) continue; // Retry on timeout
        throw new Error('Request timed out. Please check your connection.');
      }
      // Handle network errors or other fetch exceptions
      if (i < retries - 1) {
        await delay(100 * (i + 1));
        continue;
      }
      console.error(`Unhandled API Error on path ${path}:`, error);
      const message = error instanceof Error ? error.message : 'An unknown network error occurred.';
      // Do not toast here, let react-query handle UI feedback
      throw new Error(message);
    }
  }
  // This should be unreachable if retries > 0
  throw new Error('API request failed after multiple retries.');
}