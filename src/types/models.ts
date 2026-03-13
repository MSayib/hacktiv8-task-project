export type Provider = "google" | "openrouter" | "openai" | "anthropic";

export interface RateLimit {
  rpm: number;
  rpd: number;
  tpm: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  provider: Provider;
  free: boolean;
  isDefault?: boolean;
  isPreview?: boolean;
  rateLimit: RateLimit;
  features: string[];
  knowledgeCutoff?: string;
}
