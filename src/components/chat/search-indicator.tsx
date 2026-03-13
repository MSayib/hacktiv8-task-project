"use client";

import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

export function SearchIndicator() {
  const t = useTranslations("chat");

  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm">
        <div className="thinking-shimmer rounded-full p-1">
          <Globe className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-muted-foreground animate-pulse">
          {t("searchingWeb")}
        </span>
      </div>
    </div>
  );
}
