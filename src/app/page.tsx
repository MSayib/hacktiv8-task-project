"use client";

import { useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ModelSelector } from "@/components/settings/model-selector";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { AboutDialog } from "@/components/layout/about-dialog";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { Attachment } from "@/types/chat";

export default function Home() {
  const createConversation = useChatStore((s) => s.createConversation);
  const activeId = useChatStore((s) => s.activeConversationId);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const retryMessage = useChatStore((s) => s.retryMessage);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const renameConversation = useChatStore((s) => s.renameConversation);
  const modelId = useSettingsStore((s) => s.modelId);
  const parameters = useSettingsStore((s) => s.parameters);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);
  const featureToggles = useSettingsStore((s) => s.featureToggles);
  const abortRef = useRef<AbortController | null>(null);

  // Always show welcome screen on initial page load
  useEffect(() => {
    useChatStore.getState().setActiveConversation(null);
  }, []);

  // Dynamic browser title
  useEffect(() => {
    const conv = useChatStore.getState().conversations.find((c) => c.id === activeId);
    document.title = conv
      ? `${conv.title} — KodingBuddy`
      : "KodingBuddy — Belajar Coding Jadi Seru!";
  }, [activeId]);

  // Shared streaming logic
  const streamResponse = useCallback(
    async (convId: string, botMessageId: string) => {
      try {
        const conversation = useChatStore
          .getState()
          .conversations.find((c) => c.id === convId);
        const messages = conversation?.messages
          .filter((m) => !m.isStreaming)
          .map((m) => ({
            role: m.role,
            content: m.content,
            ...(m.attachments?.length && {
              attachments: m.attachments.map((a) => ({
                name: a.name,
                mimeType: a.mimeType,
                data: a.data,
              })),
            }),
          })) ?? [];

        const body: Record<string, unknown> = {
          messages,
          model: modelId,
        };

        if (parameters.enabled) {
          body.temperature = parameters.temperature;
          body.topK = parameters.topK;
          body.topP = parameters.topP;
        }

        if (apiKeyOverride.enabled && apiKeyOverride.saved && apiKeyOverride.key) {
          body.customApiKey = apiKeyOverride.key;
        }

        // Send explicit feature toggles for custom models, or override default behavior
        if (featureToggles.thinking || featureToggles.search) {
          body.features = {
            thinking: featureToggles.thinking,
            search: featureToggles.search,
          };
        }

        const controller = new AbortController();
        abortRef.current = controller;

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let accumulated = "";
        let thinkingText = "";
        let isStillThinking = true;
        let searchSources: { title: string; url: string }[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.message || "Terjadi kesalahan");
              }
              if (parsed.searching !== undefined) {
                updateMessage(convId, botMessageId, {
                  isSearching: parsed.searching,
                });
              } else if (parsed.searchSources) {
                searchSources = parsed.searchSources;
                updateMessage(convId, botMessageId, {
                  searchSources: parsed.searchSources,
                });
              } else if (parsed.thinking) {
                thinkingText += parsed.text ?? "";
                updateMessage(convId, botMessageId, {
                  thinking: thinkingText,
                  isThinking: true,
                  isSearching: false,
                });
              } else {
                if (isStillThinking) {
                  isStillThinking = false;
                  updateMessage(convId, botMessageId, {
                    isThinking: false,
                    isSearching: false,
                  });
                }
                accumulated += parsed.text ?? "";
                updateMessage(convId, botMessageId, {
                  content: accumulated,
                });
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        updateMessage(convId, botMessageId, {
          isStreaming: false,
          isThinking: false,
          isSearching: false,
          content: accumulated,
          thinking: thinkingText || undefined,
          searchSources: searchSources.length > 0 ? searchSources : undefined,
        });
      } catch (error) {
        // Abort is intentional — finalize the message with what we have so far
        if (error instanceof DOMException && error.name === "AbortError") {
          const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
          const botMsg = conv?.messages.find((m) => m.id === botMessageId);
          updateMessage(convId, botMessageId, {
            isStreaming: false,
            isThinking: false,
            isSearching: false,
            content: botMsg?.content || "",
          });
        } else {
          updateMessage(convId, botMessageId, {
            isStreaming: false,
            isThinking: false,
            content:
              error instanceof Error
                ? `Error: ${error.message}`
                : "Terjadi kesalahan",
          });
        }
      } finally {
        abortRef.current = null;
        setIsStreaming(false);
      }
    },
    [updateMessage, setIsStreaming, modelId, parameters, apiKeyOverride, featureToggles]
  );

  // Generate AI title for new conversations
  const generateTitle = useCallback(
    async (convId: string, userContent: string, botContent: string) => {
      try {
        const titleBody: Record<string, unknown> = {
          userMessage: userContent,
          assistantMessage: botContent,
        };

        if (apiKeyOverride.enabled && apiKeyOverride.saved && apiKeyOverride.key) {
          titleBody.customApiKey = apiKeyOverride.key;
        }

        const res = await fetch("/api/title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(titleBody),
        });

        if (res.ok) {
          const { title } = await res.json();
          if (title) {
            renameConversation(convId, title);
          }
        }
      } catch {
        // Title generation failure is non-critical, silently ignore
      }
    },
    [apiKeyOverride, renameConversation]
  );

  const handleSend = useCallback(
    async (content: string, attachments?: Attachment[]) => {
      let convId = activeId;
      const isNewConversation = !convId;
      if (!convId) {
        convId = createConversation(modelId);
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content,
        attachments,
        createdAt: new Date().toISOString(),
      };
      addMessage(convId, userMessage);
      setIsStreaming(true);

      const botMessageId = crypto.randomUUID();
      addMessage(convId, {
        id: botMessageId,
        role: "model",
        content: "",
        isStreaming: true,
        createdAt: new Date().toISOString(),
      });

      await streamResponse(convId, botMessageId);

      // Generate AI title for new conversations after first exchange
      if (isNewConversation) {
        const conv = useChatStore.getState().conversations.find((c) => c.id === convId);
        const botMsg = conv?.messages.find((m) => m.id === botMessageId);
        if (botMsg?.content && !botMsg.content.startsWith("Error:")) {
          generateTitle(convId, content || attachments?.[0]?.name || "", botMsg.content);
        }
      }
    },
    [
      activeId,
      createConversation,
      addMessage,
      setIsStreaming,
      modelId,
      streamResponse,
      generateTitle,
    ]
  );

  const handleRetry = useCallback(
    async (userMessageId: string) => {
      if (!activeId) return;

      const result = retryMessage(activeId, userMessageId);
      if (!result) return;

      setIsStreaming(true);
      await streamResponse(activeId, result.newBotMessageId);
    },
    [activeId, retryMessage, setIsStreaming, streamResponse]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatInterface onSend={handleSend} onRetry={handleRetry} onStop={handleStop} />
        </main>
      </div>
      <ModelSelector />
      <SettingsDialog />
      <AboutDialog />
    </div>
  );
}
