import { GoogleGenAI } from '@google/genai';

/**
 * Server-side Gemini API client instance.
 * Safe singleton initialized with GEMINI_API_KEY environment variable.
 */
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn(
      '[WardrobeAI Gemini] Warning: GEMINI_API_KEY is not set in environment variables. Falling back to development mock if needed.'
    );
  }
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
}

export const geminiClient = getGeminiClient();

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
