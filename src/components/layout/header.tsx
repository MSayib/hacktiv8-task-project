"use client";

import { useTranslations } from "next-intl";
import {
  PanelLeft,
  Settings,
  Info,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitcher } from "@/components/settings/language-switcher";
import { useUIStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { getModelById } from "@/lib/models";
import { Badge } from "@/components/ui/badge";

export function Header() {
  const t = useTranslations();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const setAboutOpen = useUIStore((s) => s.setAboutOpen);
  const setModelSelectorOpen = useUIStore((s) => s.setModelSelectorOpen);
  const modelId = useSettingsStore((s) => s.modelId);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);

  const model = getModelById(modelId);

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-9 w-9"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          className="flex items-center gap-1.5 text-sm font-medium"
          onClick={() => setModelSelectorOpen(true)}
        >
          <span className="max-w-[200px] truncate">
            {model?.name ?? modelId}
          </span>
          {model?.isPreview && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {t("models.preview")}
            </Badge>
          )}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold tracking-tight gradient-text hidden sm:block">
        Koding Buddy
      </h1>

      <div className="flex items-center gap-1">
        {apiKeyOverride.enabled && apiKeyOverride.saved && (
          <Badge variant="outline" className="text-xs mr-1">
            Custom Key
          </Badge>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          className="h-9 w-9"
          title={t("settings.title")}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <ThemeToggle />
        <LanguageSwitcher />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setAboutOpen(true)}
          className="h-9 w-9"
          title={t("about.title")}
        >
          <Info className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
