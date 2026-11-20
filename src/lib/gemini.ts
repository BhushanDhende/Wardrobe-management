import { GoogleGenAI } from '@google/genai';

/**
 * Check if a given or environment Gemini API key is valid.
 */
export function isGeminiKeyConfigured(customKey?: string): boolean {
  const apiKey = (customKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  return Boolean(
    apiKey &&
      !apiKey.includes('your_actual_gemini_api_key') &&
      !apiKey.includes('your_gemini_api_key') &&
      apiKey.length > 15
  );
}

/**
 * Server-side Gemini API client instance helper.
 * Supports environment variable or per-request client-provided key.
 */
export function getGeminiClientWithKey(customKey?: string): { client: GoogleGenAI; hasValidKey: boolean } {
  const apiKey = (customKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const valid = isGeminiKeyConfigured(apiKey);
  const safeKey = valid ? apiKey : 'dummy-placeholder-key';
  return {
    client: new GoogleGenAI({ apiKey: safeKey }),
    hasValidKey: valid,
  };
}

/**
 * Default singleton instance
 */
export const geminiClient = getGeminiClientWithKey().client;

/**
 * Execute a Gemini API call with automatic retries and exponential backoff
 */
export async function withGeminiRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delayMs = 1200
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (err) {
      lastError = err;
      console.error(`Gemini API call failed (attempt ${attempt}/${retries}):`, err);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  throw lastError;
}
