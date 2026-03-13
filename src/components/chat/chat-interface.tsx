"use client";

import { useRef, useEffect, useMemo } from "react";
import { useChatStore } from "@/stores/chat-store";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ThinkingIndicator } from "./thinking-indicator";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEVELOPER_NAME, DEVELOPER_GITHUB } from "@/lib/constants";
import { useSettingsStore } from "@/stores/settings-store";

interface ChatInterfaceProps {
  onSend: (message: string) => void;
}

export function ChatInterface({ onSend }: ChatInterfaceProps) {
  const activeConversation = useChatStore((s) => s.getActiveConversation());
  const isStreaming = useChatStore((s) => s.isStreaming);
  const modelId = useSettingsStore((s) => s.modelId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation?.messages]
  );
  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isStreaming && lastMessage?.role === "user";
  const showThinking =
    isStreaming && lastMessage?.role === "model" && lastMessage?.isThinking;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="mx-auto max-w-3xl py-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {showTyping && <TypingIndicator />}
          {showThinking && <ThinkingIndicator />}
        </div>
      </ScrollArea>

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <ChatInput onSend={onSend} disabled={isStreaming} />
        <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-muted-foreground">
          <span>
            Model: {modelId} | Temp: {useSettingsStore.getState().parameters.temperature}
          </span>
          <span>
            KodingBuddy — Built with ❤️ by{" "}
            <a
              href={DEVELOPER_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {DEVELOPER_NAME}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
