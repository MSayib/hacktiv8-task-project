"use client";

import { Brain, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { AVAILABLE_MODELS } from "@/lib/constants";

export function FeatureToggles() {
  const modelId = useSettingsStore((s) => s.modelId);
  const featureToggles = useSettingsStore((s) => s.featureToggles);
  const setFeatureToggles = useSettingsStore((s) => s.setFeatureToggles);
  const customModels = useSettingsStore((s) => s.customModels);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);

  // Determine available features for the current model
  const builtInModel = AVAILABLE_MODELS.find((m) => m.id === modelId);
  const customModel =
    apiKeyOverride.enabled && apiKeyOverride.saved
      ? customModels.find((m) => m.id === modelId)
      : null;

  const features = builtInModel?.features ?? customModel?.features ?? [];

  const supportsThinking =
    features.includes("thinking") || features.includes("deep_think");
  const supportsSearch = features.includes("search");

  const hasAnyToggle = supportsThinking || supportsSearch;
  if (!hasAnyToggle) return null;

  const thinkingLabel = features.includes("deep_think")
    ? "Deep Think"
    : "Thinking";

  return (
    <div className="flex items-center gap-1.5 px-1 mb-1">
      {supportsThinking && (
        <button
          onClick={() =>
            setFeatureToggles({ thinking: !featureToggles.thinking })
          }
        >
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 gap-1 cursor-pointer transition-all select-none border",
              featureToggles.thinking
                ? "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700 ring-1 ring-purple-200 dark:ring-purple-800"
                : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            <Brain className="h-3 w-3" />
            {thinkingLabel}
          </Badge>
        </button>
      )}
      {supportsSearch && (
        <button
          onClick={() =>
            setFeatureToggles({ search: !featureToggles.search })
          }
        >
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-2 py-0.5 gap-1 cursor-pointer transition-all select-none border",
              featureToggles.search
                ? "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700 ring-1 ring-blue-200 dark:ring-blue-800"
                : "text-muted-foreground hover:bg-accent/50"
            )}
          >
            <Globe className="h-3 w-3" />
            Search
          </Badge>
        </button>
      )}
    </div>
  );
}
