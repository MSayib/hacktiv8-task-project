"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Check, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Message } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageActionsProps {
  message: Message;
  onRetry?: () => void;
}

export function MessageActions({ message, onRetry }: MessageActionsProps) {
  const t = useTranslations("chat");
  const [liked, setLiked] = useState<boolean | null>(message.liked ?? null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={t("like")}
        onClick={() => setLiked(liked === true ? null : true)}
      >
        <ThumbsUp
          className={cn(
            "h-3.5 w-3.5",
            liked === true && "fill-current text-green-500"
          )}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={t("dislike")}
        onClick={() => setLiked(liked === false ? null : false)}
      >
        <ThumbsDown
          className={cn(
            "h-3.5 w-3.5",
            liked === false && "fill-current text-red-500"
          )}
        />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        title={t("copyOutput")}
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>

      {onRetry && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={t("retry")}
          onClick={onRetry}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
