"use client";

import { useRef, useCallback, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const t = useTranslations("chat");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const value = textareaRef.current?.value.trim();
    if (!value || disabled) return;
    onSend(value);
    if (textareaRef.current) {
      textareaRef.current.value = "";
      textareaRef.current.style.height = "auto";
    }
  }, [onSend, disabled]);

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

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm">
      <Textarea
        ref={textareaRef}
        placeholder={t("placeholder")}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        disabled={disabled}
        rows={1}
        className="min-h-[40px] max-h-[200px] resize-none border-0 bg-transparent px-2 py-2 text-sm shadow-none focus-visible:ring-0"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled}
        className="h-9 w-9 shrink-0 rounded-xl gradient-primary text-white hover:opacity-90"
      >
        <SendHorizonal className="h-4 w-4" />
      </Button>
    </div>
  );
}
