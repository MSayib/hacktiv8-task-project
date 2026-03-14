export interface ModelParameters {
  temperature: number;
  topK: number;
  topP: number;
  enabled: boolean;
}

export interface ApiKeyOverride {
  enabled: boolean;
  key: string;
  saved: boolean;
}

export interface DiscoveredModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedActions: string[];
  features: string[];
}

export interface FeatureToggles {
  thinking: boolean;
  search: boolean;
}

export interface Settings {
  modelId: string;
  parameters: ModelParameters;
  apiKeyOverride: ApiKeyOverride;
  locale: "id" | "en";
  customModels: DiscoveredModel[];
  featureToggles: FeatureToggles;
}
