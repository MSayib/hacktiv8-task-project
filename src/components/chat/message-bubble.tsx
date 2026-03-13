"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Message, Attachment } from "@/types/chat";
import { formatFileSize } from "@/lib/attachments";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { MessageActions } from "./message-actions";
import { ImageLightbox } from "./image-lightbox";
import { PdfPreviewDialog } from "./pdf-preview-dialog";
import { SearchSources } from "./search-sources";
import { User, Sparkles, FileText, Music } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
}

export function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const isUser = message.role === "user";

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
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-4 py-3",
              isUser ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        )}

        {/* Search sources */}
        {!isUser && message.searchSources && message.searchSources.length > 0 && (
          <SearchSources sources={message.searchSources} />
        )}

        {!isUser && !message.isStreaming && (
          <MessageActions message={message} onRetry={onRetry} />
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
