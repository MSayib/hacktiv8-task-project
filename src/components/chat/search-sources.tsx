"use client";

import { useTranslations } from "next-intl";
import { Globe, ExternalLink } from "lucide-react";
import type { SearchSource } from "@/types/chat";

interface SearchSourcesProps {
  sources: SearchSource[];
}

export function SearchSources({ sources }: SearchSourcesProps) {
  const t = useTranslations("chat");

  if (sources.length === 0) return null;

  return (
    <div className="mt-1 w-full rounded-lg border border-border/50 bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          {t("searchSources")} ({sources.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, i) => (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-md bg-background px-2 py-1 text-xs text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
          >
            <span className="truncate max-w-[200px]">{source.title}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}
