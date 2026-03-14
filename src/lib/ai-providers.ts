import { GoogleGenAI } from "@google/genai";

export function createGoogleClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export function getApiKey(customApiKey?: string): string | undefined {
  if (customApiKey) return customApiKey;
  return process.env.GEMINI_API_KEY;
}
