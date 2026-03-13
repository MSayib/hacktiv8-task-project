"use client";

import { useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import { AVAILABLE_MODELS, DEVELOPER_NAME, DEVELOPER_GITHUB } from "@/lib/constants";
import { formatTokenCount } from "@/lib/models";
import type { Attachment } from "@/types/chat";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ThinkingIndicator } from "./thinking-indicator";
import { SearchIndicator } from "./search-indicator";
import { ChatInput } from "./chat-input";
import { WelcomeScreen } from "./welcome-screen";

interface ChatInterfaceProps {
  onSend: (message: string, attachments?: Attachment[]) => void;
  onRetry?: (userMessageId: string) => void;
}

export function ChatInterface({ onSend, onRetry }: ChatInterfaceProps) {
  const activeConversation = useChatStore((s) => s.getActiveConversation());
  const isStreaming = useChatStore((s) => s.isStreaming);
  const modelId = useSettingsStore((s) => s.modelId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const modelDef = useMemo(
    () => AVAILABLE_MODELS.find((m) => m.id === modelId),
    [modelId]
  );
  const supportsMultimodal = modelDef?.features.includes("multimodal") ?? false;

  const messages = useMemo(
    () => activeConversation?.messages ?? [],
    [activeConversation?.messages]
  );
  const lastMessage = messages[messages.length - 1];
  const showTyping =
    isStreaming && lastMessage?.role === "model" && !lastMessage?.isSearching && !lastMessage?.isThinking && !lastMessage?.content;
  const showSearching =
    isStreaming && lastMessage?.role === "model" && lastMessage?.isSearching;
  const showThinking =
    isStreaming && lastMessage?.role === "model" && lastMessage?.isThinking;

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, lastMessage?.content, scrollToBottom]);

  const hasMessages = hydrated && messages.length > 0;

  return (
    <div className="flex h-full flex-col">
      {hasMessages ? (
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto"
        >
          <div className="mx-auto max-w-3xl px-4 py-6">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onRetry={onRetry}
                siblingModelMessage={
                  msg.role === "user" && idx + 1 < messages.length && messages[idx + 1].role === "model"
                    ? messages[idx + 1]
                    : undefined
                }
              />
            ))}
            {showTyping && <TypingIndicator />}
            {showSearching && <SearchIndicator />}
            {showThinking && <ThinkingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <WelcomeScreen onSuggestionClick={onSend} />
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl px-4 pb-4">
        <ChatInput
          onSend={onSend}
          disabled={isStreaming}
          supportsMultimodal={supportsMultimodal}
        />
        <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-muted-foreground">
          <span>
            Model: {modelId}
            {modelDef && ` | Context: ${formatTokenCount(modelDef.contextWindow)}`}
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
