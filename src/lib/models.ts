import { AVAILABLE_MODELS, DEFAULT_MODEL_ID } from "./constants";

export function getModelById(id: string) {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getDefaultModel() {
  return (
    AVAILABLE_MODELS.find((m) => m.isDefault) ??
    AVAILABLE_MODELS.find((m) => m.id === DEFAULT_MODEL_ID) ??
    AVAILABLE_MODELS[0]
  );
}

export function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(0)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}
