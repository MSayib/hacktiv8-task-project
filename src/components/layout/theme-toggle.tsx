"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSyncExternalStore } from "react";

function useMounted() {
  return useSyncExternalStore(
    (cb) => { void cb; return () => {}; },
    () => true,
    () => false
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("common");
  const mounted = useMounted();

  return (
    <Tooltip>
      <TooltipTrigger
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        {mounted && theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
        <span className="sr-only">
          {mounted && theme === "dark" ? t("lightMode") : t("darkMode")}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {mounted && theme === "dark" ? t("lightMode") : t("darkMode")}
      </TooltipContent>
    </Tooltip>
  );
}
