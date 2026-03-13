import type { Provider } from "./models";

export interface ModelParameters {
  temperature: number;
  topK: number;
  topP: number;
  enabled: boolean;
}

export interface ApiKeyOverride {
  enabled: boolean;
  provider: Provider;
  key: string;
}

export interface Settings {
  modelId: string;
  parameters: ModelParameters;
  apiKeyOverride: ApiKeyOverride;
  locale: "id" | "en";
}
