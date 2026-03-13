"use client";

import { cn } from "@/lib/utils";
import type { Message } from "@/types/chat";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { MessageActions } from "./message-actions";
import { User, Sparkles } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "gradient-primary text-white"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1",
          isUser ? "items-end" : "items-start"
        )}
      >
        {message.thinking && (
          <details className="mb-2 w-full">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Thinking...
            </summary>
            <div className="mt-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <MarkdownRenderer content={message.thinking} />
            </div>
          </details>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {!isUser && !message.isStreaming && (
          <MessageActions message={message} onRetry={onRetry} />
        )}
      </div>
    </div>
  );
}
