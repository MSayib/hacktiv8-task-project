"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useUIStore } from "@/stores/ui-store";
import {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  DEVELOPER_NAME,
  DEVELOPER_GITHUB,
} from "@/lib/constants";

export function AboutDialog() {
  const t = useTranslations("about");
  const open = useUIStore((s) => s.aboutOpen);
  const setOpen = useUIStore((s) => s.setAboutOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{APP_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white font-bold text-lg">
              KB
            </div>
            <div>
              <h3 className="font-bold gradient-text bg-clip-text text-transparent">
                {APP_NAME}
              </h3>
              <p className="text-xs text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("version")}</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("builtBy")}</span>
              <a
                href={DEVELOPER_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                {DEVELOPER_NAME}
              </a>
            </div>
          </div>

          <Separator />

          <div className="text-center text-xs text-muted-foreground">
            <p>Powered by Google Gemini AI</p>
            <p className="mt-1">
              Built with Next.js, shadcn/ui & Tailwind CSS
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
