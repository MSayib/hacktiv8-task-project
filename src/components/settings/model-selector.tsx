"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Info, Zap, Brain, Star, ImageIcon, Music, FileText, Globe, Key } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { AVAILABLE_MODELS, FREE_TIER_INFO } from "@/lib/constants";
import { formatTokenCount } from "@/lib/models";
import type { ModelDefinition } from "@/types/models";
import type { DiscoveredModel } from "@/types/settings";

interface FeatureBadgeConfig {
  icon: React.ReactNode;
  label: string;
  className: string;
}

function getFeatureBadges(features: string[]): FeatureBadgeConfig[] {
  const badges: FeatureBadgeConfig[] = [];

  for (const f of features) {
    switch (f) {
      case "thinking":
        badges.push({
          icon: <Brain className="h-3 w-3" />,
          label: "Thinking",
          className: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
        });
        break;
      case "deep_think":
        badges.push({
          icon: <Brain className="h-3 w-3" />,
          label: "Deep Think",
          className: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800",
        });
        break;
      case "code":
        badges.push({
          icon: <Zap className="h-3 w-3" />,
          label: "Code",
          className: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
        });
        break;
      case "search":
        badges.push({
          icon: <Globe className="h-3 w-3" />,
          label: "Search",
          className: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
        });
        break;
      case "multimodal":
        badges.push(
          {
            icon: <ImageIcon className="h-3 w-3" />,
            label: "Image",
            className: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800",
          },
          {
            icon: <Music className="h-3 w-3" />,
            label: "Audio",
            className: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800",
          },
          {
            icon: <FileText className="h-3 w-3" />,
            label: "Document",
            className: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
          }
        );
        break;
      // Skip non-display features
      case "structured_output":
      case "thought_signatures":
        break;
    }
  }

  return badges;
}

function ModelCard({
  model,
  isSelected,
  onSelect,
  onToggleInfo,
  showInfo,
}: {
  model: ModelDefinition;
  isSelected: boolean;
  onSelect: () => void;
  onToggleInfo: () => void;
  showInfo: boolean;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-0">
      <button
        className={`w-full rounded-lg border p-3 text-left transition-all hover:bg-accent/50 ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border"
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{model.name}</span>
              {model.isDefault && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  <Star className="h-2.5 w-2.5 mr-0.5" />
                  Default
                </Badge>
              )}
              {model.isPreview && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {t("models.preview")}
                </Badge>
              )}
              {model.free && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                >
                  Free
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {model.description}
            </p>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {getFeatureBadges(model.features).map((badge) => (
                <Badge
                  key={badge.label}
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 gap-0.5 border ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              role="button"
              tabIndex={0}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggleInfo();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onToggleInfo();
                }
              }}
              title={t("models.info")}
            >
              <Info className="h-3.5 w-3.5" />
            </span>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>
      </button>

      {showInfo && (
        <div className="mx-2 rounded-b-lg border border-t-0 bg-muted/30 p-3 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">Context Window</span>
              <p className="font-medium">
                {formatTokenCount(model.contextWindow)} tokens
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Max Output</span>
              <p className="font-medium">
                {formatTokenCount(model.maxOutputTokens)} tokens
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">Rate Limits (Free)</span>
            <p className="font-medium">
              {model.rateLimit.rpm} RPM / {model.rateLimit.rpd} RPD /{" "}
              {formatTokenCount(model.rateLimit.tpm)} TPM
            </p>
          </div>
          {model.knowledgeCutoff && (
            <div>
              <span className="text-muted-foreground">Knowledge Cutoff</span>
              <p className="font-medium">{model.knowledgeCutoff}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CustomModelCard({
  model,
  isSelected,
  onSelect,
  onToggleInfo,
  showInfo,
}: {
  model: DiscoveredModel;
  isSelected: boolean;
  onSelect: () => void;
  onToggleInfo: () => void;
  showInfo: boolean;
}) {
  const featureBadges = getFeatureBadges(model.features ?? []);

  return (
    <div className="space-y-0">
      <button
        className={`w-full rounded-lg border p-3 text-left transition-all hover:bg-accent/50 ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border"
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{model.name}</span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 gap-0.5 border border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400"
              >
                <Key className="h-2.5 w-2.5" />
                Custom
              </Badge>
            </div>
            {model.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {model.description}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {featureBadges.map((badge) => (
                <Badge
                  key={badge.label}
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 gap-0.5 border ${badge.className}`}
                >
                  {badge.icon}
                  {badge.label}
                </Badge>
              ))}
              {featureBadges.length === 0 && (
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 gap-0.5 border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                >
                  <Zap className="h-3 w-3" />
                  Generate
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              role="button"
              tabIndex={0}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onToggleInfo();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                  onToggleInfo();
                }
              }}
              title="Info"
            >
              <Info className="h-3.5 w-3.5" />
            </span>
            {isSelected && <Check className="h-4 w-4 text-primary" />}
          </div>
        </div>
      </button>

      {showInfo && (
        <div className="mx-2 rounded-b-lg border border-t-0 bg-muted/30 p-3 text-xs space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {model.inputTokenLimit && (
              <div>
                <span className="text-muted-foreground">Context Window</span>
                <p className="font-medium">
                  {formatTokenCount(model.inputTokenLimit)} tokens
                </p>
              </div>
            )}
            {model.outputTokenLimit && (
              <div>
                <span className="text-muted-foreground">Max Output</span>
                <p className="font-medium">
                  {formatTokenCount(model.outputTokenLimit)} tokens
                </p>
              </div>
            )}
          </div>
          <Separator />
          <div>
            <span className="text-muted-foreground">Model ID</span>
            <p className="font-medium font-mono text-[11px]">{model.id}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function ModelSelector() {
  const t = useTranslations();
  const open = useUIStore((s) => s.modelSelectorOpen);
  const setOpen = useUIStore((s) => s.setModelSelectorOpen);
  const modelId = useSettingsStore((s) => s.modelId);
  const setModelId = useSettingsStore((s) => s.setModelId);
  const customModels = useSettingsStore((s) => s.customModels);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [showFreeTierInfo, setShowFreeTierInfo] = useState(false);

  const hasCustomModels = apiKeyOverride.enabled && apiKeyOverride.saved && customModels.length > 0;

  const handleSelect = (id: string) => {
    setModelId(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("models.selectModel")}</DialogTitle>
          <DialogDescription>{t("models.selectDescription")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-2 pr-3">
            {hasCustomModels ? (
              <>
                {/* Custom models from user's API key — replaces default list */}
                <div className="flex items-center gap-2 px-1 mb-2">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Model dari API Key Anda ({customModels.length})
                  </span>
                </div>
                {customModels.map((model) => (
                  <CustomModelCard
                    key={model.id}
                    model={model}
                    isSelected={model.id === modelId}
                    onSelect={() => handleSelect(model.id)}
                    onToggleInfo={() =>
                      setExpandedModel(
                        expandedModel === model.id ? null : model.id
                      )
                    }
                    showInfo={expandedModel === model.id}
                  />
                ))}
              </>
            ) : (
              <>
                {/* Built-in models (shown when no custom key) */}
                {AVAILABLE_MODELS.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    isSelected={model.id === modelId}
                    onSelect={() => handleSelect(model.id)}
                    onToggleInfo={() =>
                      setExpandedModel(
                        expandedModel === model.id ? null : model.id
                      )
                    }
                    showInfo={expandedModel === model.id}
                  />
                ))}

                <Separator />
                <div>
                  <button
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowFreeTierInfo(!showFreeTierInfo)}
                  >
                    <Info className="h-3.5 w-3.5" />
                    {t("models.freeTierInfo")}
                  </button>
                  {showFreeTierInfo && (
                    <div className="mt-2 rounded-lg bg-muted/50 p-3 text-xs space-y-2">
                      <p>
                        <strong>1.</strong> {FREE_TIER_INFO.dataUsage}
                      </p>
                      <p>
                        <strong>2.</strong> {FREE_TIER_INFO.multimodal}
                      </p>
                      <p>
                        <strong>3.</strong> {FREE_TIER_INFO.quotaReset}
                      </p>
                      <p>
                        <strong>4.</strong> {FREE_TIER_INFO.preview}
                      </p>
                      <button
                        className="mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                        onClick={() => setShowFreeTierInfo(false)}
                      >
                        {t("common.close")}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
