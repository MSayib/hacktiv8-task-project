"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Info, Sparkles, Zap, Brain, Star } from "lucide-react";
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

function FeatureIcon({ feature }: { feature: string }) {
  switch (feature) {
    case "thinking":
    case "deep_think":
      return <Brain className="h-3 w-3" />;
    case "code":
      return <Zap className="h-3 w-3" />;
    case "search":
      return <Sparkles className="h-3 w-3" />;
    default:
      return null;
  }
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
              {model.features.slice(0, 4).map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="text-[10px] px-1 py-0 gap-0.5"
                >
                  <FeatureIcon feature={f} />
                  {f}
                </Badge>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              className="p-1 rounded-md hover:bg-muted text-muted-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onToggleInfo();
              }}
              title={t("models.info")}
            >
              <Info className="h-3.5 w-3.5" />
            </button>
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

export function ModelSelector() {
  const t = useTranslations();
  const open = useUIStore((s) => s.modelSelectorOpen);
  const setOpen = useUIStore((s) => s.setModelSelectorOpen);
  const modelId = useSettingsStore((s) => s.modelId);
  const setModelId = useSettingsStore((s) => s.setModelId);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [showFreeTierInfo, setShowFreeTierInfo] = useState(false);

  const handleSelect = (id: string) => {
    setModelId(id);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("models.selectModel")}</DialogTitle>
          <DialogDescription>{t("models.selectDescription")}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          <div className="space-y-2 pr-3">
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
          </div>
        </ScrollArea>

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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
