import { GoogleGenAI } from "@google/genai";
import type { Provider } from "@/types/models";

export function createGoogleClient(apiKey: string) {
  return new GoogleGenAI({ apiKey });
}

export function getApiKey(
  provider: Provider,
  customApiKey?: string
): string | undefined {
  if (customApiKey) return customApiKey;

  switch (provider) {
    case "google":
      return process.env.GEMINI_API_KEY;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}
