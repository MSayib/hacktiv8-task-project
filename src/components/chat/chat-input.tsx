"use client";

import {
  useRef,
  useState,
  useCallback,
  type KeyboardEvent,
  type ClipboardEvent,
  type DragEvent,
} from "react";
import { useTranslations } from "next-intl";
import { SendHorizonal, Paperclip, Mic, X, FileText, Music, ImageIcon, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Attachment } from "@/types/chat";
import {
  fileToAttachment,
  formatFileSize,
  IMAGE_MIME_TYPES,
  DOCUMENT_MIME_TYPES,
  AUDIO_MIME_TYPES,
  MAX_ATTACHMENTS,
  isMimeTypeAccepted,
} from "@/lib/attachments";
import { AudioRecorder } from "./audio-recorder";

interface ChatInputProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  onStop?: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  supportsMultimodal?: boolean;
  searchActive?: boolean;
}

export function ChatInput({ onSend, onStop, disabled, isStreaming, supportsMultimodal, searchActive }: ChatInputProps) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const remaining = MAX_ATTACHMENTS - attachments.length;
      if (remaining <= 0) {
        toast.error(t("maxAttachments"));
        return;
      }
      const toProcess = fileArray.slice(0, remaining);
      for (const file of toProcess) {
        if (!isMimeTypeAccepted(file.type)) {
          toast.error(`${t("unsupportedFile")}: ${file.name}`);
          continue;
        }
        try {
          const attachment = await fileToAttachment(file);
          setAttachments((prev) => [...prev, attachment]);
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("fileError"));
        }
      }
    },
    [attachments.length, t]
  );

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim() ?? "";
    if (!value && attachments.length === 0) return;
    if (disabled) return;

    onSend(value, attachments.length > 0 ? attachments : undefined);

    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }, [onSend, disabled, attachments]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, []);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLTextAreaElement>) => {
      if (!supportsMultimodal) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
      }
    },
    [supportsMultimodal, processFiles]
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleRemoveAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleRecordingComplete = useCallback(
    (attachment: Attachment) => {
      setAttachments((prev) => [...prev, attachment]);
      setShowRecorder(false);
    },
    []
  );

  // Conflict: when Google Search is active, audio input is not supported
  const allowAudio = supportsMultimodal && !searchActive;

  if (showRecorder) {
    return (
      <AudioRecorder
        onRecordingComplete={handleRecordingComplete}
        onCancel={() => setShowRecorder(false)}
        disabled={disabled}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-background p-3 shadow-sm transition-colors",
        isDragOver ? "border-primary border-dashed bg-primary/5" : "border-border"
      )}
      onDragOver={supportsMultimodal ? handleDragOver : undefined}
      onDragLeave={supportsMultimodal ? handleDragLeave : undefined}
      onDrop={supportsMultimodal ? handleDrop : undefined}
    >
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {attachments.map((att) => (
            <AttachmentPreview
              key={att.id}
              attachment={att}
              onRemove={() => handleRemoveAttachment(att.id)}
            />
          ))}
        </div>
      )}

      {/* Drag overlay hint */}
      {isDragOver && (
        <div className="flex items-center justify-center py-2 text-xs text-primary font-medium">
          {t("dragDrop")}
        </div>
      )}

      {/* Textarea */}
      <Textarea
        ref={textareaRef}
        placeholder={
          attachments.length > 0 ? t("describeAttachment") : t("placeholder")
        }
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        onPaste={handlePaste}
        disabled={disabled}
        rows={1}
        className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
      />

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {supportsMultimodal && (
            <>
              {/* Attachment menu */}
              <Popover open={attachMenuOpen} onOpenChange={setAttachMenuOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={disabled}
                      title={t("attachFile")}
                    />
                  }
                >
                  <Paperclip className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent className="w-44 gap-0 p-1.5" side="top" align="start">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      documentInputRef.current?.click();
                      setAttachMenuOpen(false);
                    }}
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {t("attachDocument")}
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      imageInputRef.current?.click();
                      setAttachMenuOpen(false);
                    }}
                  >
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    {t("attachImage")}
                  </button>
                  {allowAudio && (
                    <button
                      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => {
                        audioInputRef.current?.click();
                        setAttachMenuOpen(false);
                      }}
                    >
                      <Music className="h-4 w-4 text-muted-foreground" />
                      {t("attachAudio")}
                    </button>
                  )}
                </PopoverContent>
              </Popover>

              {/* Mic recording button (hidden when search is active) */}
              {allowAudio && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowRecorder(true)}
                  disabled={disabled}
                  title={t("recordAudio")}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
        {isStreaming ? (
          <Button
            size="icon"
            onClick={onStop}
            className="h-9 w-9 shrink-0 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            title="Stop"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            onClick={handleSend}
            disabled={disabled}
            className="h-9 w-9 shrink-0 rounded-xl gradient-primary text-white hover:opacity-90"
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Hidden file inputs per category */}
      <input
        ref={documentInputRef}
        type="file"
        multiple
        accept={DOCUMENT_MIME_TYPES}
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept={IMAGE_MIME_TYPES}
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept={AUDIO_MIME_TYPES}
        onChange={(e) => {
          if (e.target.files) processFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
}

function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove: () => void;
}) {
  return (
    <div className="relative shrink-0 group">
      {attachment.type === "image" && attachment.previewUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={attachment.previewUrl}
          alt={attachment.name}
          className="h-16 w-16 rounded-lg object-cover border border-border"
        />
      ) : (
        <div className="flex h-16 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-border bg-muted/50 px-2">
          {attachment.type === "audio" ? (
            <Music className="h-5 w-5 text-muted-foreground" />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="max-w-full truncate text-[10px] text-muted-foreground">
            {attachment.name}
          </span>
          <span className="text-[9px] text-muted-foreground/70">
            {formatFileSize(attachment.size)}
          </span>
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
