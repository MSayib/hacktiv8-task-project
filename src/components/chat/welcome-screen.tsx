"use client";

import { useTranslations } from "next-intl";
import { Code, Lightbulb, Rocket, BookOpen } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTION_ICONS = [
  <BookOpen key="0" className="h-4 w-4 text-gemini-blue" />,
  <Code key="1" className="h-4 w-4 text-gemini-purple" />,
  <Lightbulb key="2" className="h-4 w-4 text-gemini-pink" />,
  <Rocket key="3" className="h-4 w-4 text-gemini-orange" />,
];

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const t = useTranslations("welcome");

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
    t("suggestion4"),
  ];

  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-white text-2xl font-bold">
          KB
        </div>
        <h1 className="text-2xl font-bold gradient-text bg-clip-text text-transparent">
          {APP_NAME}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("tagline")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            className="flex items-start gap-3 rounded-xl border border-border p-3 text-left text-sm transition-all hover:bg-accent/50 hover:border-primary/20"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="mt-0.5 shrink-0">{SUGGESTION_ICONS[i]}</div>
            <span className="text-muted-foreground">{suggestion}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
