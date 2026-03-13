"use client";

import { useTranslations } from "next-intl";
import { AlertCircle, Clock, Copy, RefreshCw, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { toast } from "sonner";
import { useUIStore } from "@/stores/ui-store";
import { getModelById } from "@/lib/models";

interface ErrorMessageProps {
  message: string;
  isRateLimit?: boolean;
  modelId?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message,
  isRateLimit,
  modelId,
  onRetry,
}: ErrorMessageProps) {
  const t = useTranslations("errors");
  const setModelSelectorOpen = useUIStore((s) => s.setModelSelectorOpen);
  const model = modelId ? getModelById(modelId) : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success(t("copyError"));
  };

  if (isRateLimit) {
    return (
      <div className="mx-auto max-w-lg">
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Clock className="h-4 w-4" />
              <span className="font-medium">{t("rateLimited")}</span>
            </div>

            {model && (
              <div className="text-xs text-amber-700 dark:text-amber-300">
                <p>
                  Model: {model.name} — {model.rateLimit.rpm} RPM /{" "}
                  {model.rateLimit.rpd} RPD (Free Tier)
                </p>
                <p>{t("rateLimitDetail")}</p>
              </div>
            )}

            <div className="text-xs text-amber-700 dark:text-amber-300 space-y-0.5">
              <p className="font-medium">Saran:</p>
              <p>• {t("rateLimitSuggestion1")}</p>
              <p>• {t("rateLimitSuggestion2")}</p>
              <p>• {t("rateLimitSuggestion3")}</p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setModelSelectorOpen(true)}
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                {t("switchModel")}
              </Button>
              {onRetry && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={onRetry}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {t("rateLimitSuggestion2")}
                </Button>
              )}
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <Alert className="border-destructive/50 bg-destructive/5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">{t("generic")}</span>
          </div>

          <p className="text-xs text-muted-foreground">{message}</p>

          <div className="flex gap-2">
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={onRetry}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Coba Lagi
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={handleCopy}
            >
              <Copy className="h-3 w-3 mr-1" />
              {t("copyError")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs"
              onClick={() => setModelSelectorOpen(true)}
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              {t("switchModel")}
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}
