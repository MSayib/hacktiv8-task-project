"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PdfPreviewDialogProps {
  name: string;
  data: string;
  mimeType: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfPreviewDialog({
  name,
  data,
  mimeType,
  open,
  onOpenChange,
}: PdfPreviewDialogProps) {
  const t = useTranslations("chat");
  const pdfSrc = data ? `data:${mimeType};base64,${data}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">{name}</DialogTitle>
        </DialogHeader>
        {pdfSrc ? (
          <iframe
            src={pdfSrc}
            className="w-full flex-1 rounded-lg border"
            title={name}
          />
        ) : (
          <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
            {t("previewNotAvailable")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
