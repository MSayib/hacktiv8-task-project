"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Message, Attachment } from "@/types/chat";
import { formatFileSize } from "@/lib/attachments";
import { useStreamingText } from "@/hooks/use-streaming-text";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { MessageActions } from "./message-actions";
import { ImageLightbox } from "./image-lightbox";
import { PdfPreviewDialog } from "./pdf-preview-dialog";
import { SearchSources } from "./search-sources";
import { User, Sparkles, FileText, Music, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessageBubbleProps {
  message: Message;
  onRetry?: (messageId: string) => void;
  siblingModelMessage?: Message;
  precedingUserMessage?: Message;
}

export function MessageBubble({ message, onRetry, siblingModelMessage, precedingUserMessage }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isModel = message.role === "model";

  // Streaming text effect for model messages
  const displayedContent = useStreamingText(
    message.content,
    isModel && !!message.isStreaming
  );

  // Variant pagination for model messages
  const allVariants = message.variants && message.variants.length > 0
    ? [...message.variants, message]
    : null;
  const [activeVariantIndex, setActiveVariantIndex] = useState<number>(
    allVariants ? allVariants.length - 1 : 0
  );
  const activeMessage = allVariants ? allVariants[activeVariantIndex] : message;

  // For user messages: detect if sibling model response has an error
  const hasError = isUser && siblingModelMessage?.content?.startsWith("Error:");

  // For model messages: detect if this message has an error
  const isModelError = isModel && activeMessage.content?.startsWith("Error:");

  return (
    <div
      className={cn(
        "group flex gap-3 px-4 py-4",
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
        {activeMessage.thinking && (
          <details className="mb-2 w-full">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              Thinking...
            </summary>
            <div className="mt-1 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <MarkdownRenderer content={activeMessage.thinking} />
            </div>
          </details>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-2",
              isUser ? "justify-end" : "justify-start"
            )}
          >
            {message.attachments.map((att) => (
              <AttachmentDisplay key={att.id} attachment={att} />
            ))}
          </div>
        )}

        {/* Text content */}
        {(isUser ? message.content : (activeMessage === message ? displayedContent : activeMessage.content)) && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <MarkdownRenderer
                content={activeMessage === message ? displayedContent : activeMessage.content}
              />
            )}
          </div>
        )}

        {/* Search sources */}
        {!isUser && activeMessage.searchSources && activeMessage.searchSources.length > 0 && (
          <SearchSources sources={activeMessage.searchSources} />
        )}

        {/* Variant pagination for model messages */}
        {!isUser && allVariants && allVariants.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setActiveVariantIndex((i) => Math.max(0, i - 1))}
              disabled={activeVariantIndex === 0}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="font-mono text-[11px]">
              {activeVariantIndex + 1}/{allVariants.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setActiveVariantIndex((i) => Math.min(allVariants.length - 1, i + 1))}
              disabled={activeVariantIndex === allVariants.length - 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Message actions for model messages */}
        {!isUser && !activeMessage.isStreaming && (
          <MessageActions
            message={activeMessage}
            isError={isModelError}
            onRetry={onRetry && precedingUserMessage ? () => onRetry(precedingUserMessage.id) : undefined}
          />
        )}

        {/* Retry/resend button on user messages */}
        {isUser && !siblingModelMessage?.isStreaming && onRetry && (
          <div className={cn(
            "flex items-center gap-1 mt-1",
            hasError ? "opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
          )}>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-7 gap-1.5 text-xs",
                hasError && "text-destructive hover:text-destructive"
              )}
              onClick={() => onRetry(message.id)}
            >
              <RefreshCw className="h-3 w-3" />
              {hasError ? "Resend" : "Retry"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function AttachmentDisplay({ attachment }: { attachment: Attachment }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);

  if (attachment.type === "image") {
    const src =
      attachment.previewUrl ||
      (attachment.data
        ? `data:${attachment.mimeType};base64,${attachment.data}`
        : undefined);

    if (src) {
      return (
        <>
          <button
            onClick={() => setLightboxOpen(true)}
            className="overflow-hidden rounded-lg border border-border/50 cursor-pointer hover:opacity-90 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={attachment.name}
              className="max-h-48 max-w-xs rounded-lg object-contain"
              loading="lazy"
            />
          </button>
          <ImageLightbox
            src={src}
            alt={attachment.name}
            open={lightboxOpen}
            onOpenChange={setLightboxOpen}
          />
        </>
      );
    }
  }

  const isPdf = attachment.mimeType === "application/pdf";

  return (
    <>
      <button
        onClick={isPdf ? () => setPdfPreviewOpen(true) : undefined}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/50 bg-muted/50 px-3 py-2 text-left",
          isPdf && "cursor-pointer hover:bg-muted transition-colors"
        )}
      >
        {attachment.type === "audio" ? (
          <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{attachment.name}</p>
          <p className="text-[10px] text-muted-foreground">
            {formatFileSize(attachment.size)}
          </p>
        </div>
      </button>
      {isPdf && (
        <PdfPreviewDialog
          name={attachment.name}
          data={attachment.data}
          mimeType={attachment.mimeType}
          open={pdfPreviewOpen}
          onOpenChange={setPdfPreviewOpen}
        />
      )}
    </>
  );
}
