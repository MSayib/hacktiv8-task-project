"use client";

import { useCallback } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import { ModelSelector } from "@/components/settings/model-selector";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { AboutDialog } from "@/components/layout/about-dialog";
import { useChatStore } from "@/stores/chat-store";
import { useSettingsStore } from "@/stores/settings-store";

export default function Home() {
  const createConversation = useChatStore((s) => s.createConversation);
  const activeId = useChatStore((s) => s.activeConversationId);
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setIsStreaming = useChatStore((s) => s.setIsStreaming);
  const modelId = useSettingsStore((s) => s.modelId);
  const parameters = useSettingsStore((s) => s.parameters);
  const apiKeyOverride = useSettingsStore((s) => s.apiKeyOverride);

  const handleSend = useCallback(
    async (content: string) => {
      let convId = activeId;
      if (!convId) {
        convId = createConversation(modelId);
      }

      const userMessage = {
        id: crypto.randomUUID(),
        role: "user" as const,
        content,
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
        isThinking: true,
        createdAt: new Date().toISOString(),
      });

      try {
        const conversation = useChatStore
          .getState()
          .conversations.find((c) => c.id === convId);
        const messages = conversation?.messages
          .filter((m) => !m.isStreaming)
          .map((m) => ({ role: m.role, content: m.content })) ?? [];

        const body: Record<string, unknown> = {
          messages,
          model: modelId,
        };

        if (parameters.enabled) {
          body.temperature = parameters.temperature;
          body.topK = parameters.topK;
          body.topP = parameters.topP;
        }

        if (apiKeyOverride.enabled && apiKeyOverride.key) {
          body.customApiKey = apiKeyOverride.key;
          body.provider = apiKeyOverride.provider;
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
              if (parsed.thinking) {
                thinkingText += parsed.text ?? "";
                updateMessage(convId!, botMessageId, {
                  thinking: thinkingText,
                  isThinking: true,
                });
              } else {
                if (isStillThinking) {
                  isStillThinking = false;
                  updateMessage(convId!, botMessageId, { isThinking: false });
                }
                accumulated += parsed.text ?? "";
                updateMessage(convId!, botMessageId, {
                  content: accumulated,
                });
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        updateMessage(convId!, botMessageId, {
          isStreaming: false,
          isThinking: false,
          content: accumulated,
          thinking: thinkingText || undefined,
        });
      } catch (error) {
        updateMessage(convId!, botMessageId, {
          isStreaming: false,
          isThinking: false,
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "Terjadi kesalahan",
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [
      activeId,
      createConversation,
      addMessage,
      updateMessage,
      setIsStreaming,
      modelId,
      parameters,
      apiKeyOverride,
    ]
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ChatInterface onSend={handleSend} />
        </main>
      </div>
      <ModelSelector />
      <SettingsDialog />
      <AboutDialog />
    </div>
  );
}
