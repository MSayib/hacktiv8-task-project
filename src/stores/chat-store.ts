import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Conversation, Message } from "@/types/chat";
import { DEFAULT_MODEL_ID } from "@/lib/constants";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isStreaming: boolean;

  // Actions
  createConversation: (model?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  retryMessage: (
    conversationId: string,
    userMessageId: string
  ) => { userMessage: Message; newBotMessageId: string } | null;
  deleteAllConversations: () => void;
  setIsStreaming: (value: boolean) => void;
  getActiveConversation: () => Conversation | undefined;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,

      createConversation: (model?: string) => {
        const id = crypto.randomUUID();
        const conversation: Conversation = {
          id,
          title: "Percakapan Baru",
          messages: [],
          model: model ?? DEFAULT_MODEL_ID,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (id) =>
        set((state) => {
          const filtered = state.conversations.filter((c) => c.id !== id);
          return {
            conversations: filtered,
            activeConversationId:
              state.activeConversationId === id
                ? filtered[0]?.id ?? null
                : state.activeConversationId,
          };
        }),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        })),

      setActiveConversation: (id) => set({ activeConversationId: id }),

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date().toISOString(),
                  title:
                    c.messages.length === 0 && message.role === "user"
                      ? (message.content || message.attachments?.[0]?.name || "Attachment").slice(0, 50) +
                        ((message.content || message.attachments?.[0]?.name || "Attachment").length > 50 ? "..." : "")
                      : c.title,
                }
              : c
          ),
        })),

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),

      deleteAllConversations: () =>
        set({ conversations: [], activeConversationId: null }),

      retryMessage: (conversationId, userMessageId) => {
        const state = get();
        const conv = state.conversations.find((c) => c.id === conversationId);
        if (!conv) return null;

        const userIdx = conv.messages.findIndex((m) => m.id === userMessageId);
        if (userIdx === -1) return null;

        const userMessage = conv.messages[userIdx];
        const modelIdx = userIdx + 1;
        const modelMessage = modelIdx < conv.messages.length ? conv.messages[modelIdx] : null;

        const newBotMessageId = crypto.randomUUID();

        if (modelMessage && modelMessage.role === "model") {
          // Move the existing model response into variants, replace with new placeholder
          const existingVariants = modelMessage.variants ?? [];
          const oldVariant: Message = {
            ...modelMessage,
            variants: undefined,
            isStreaming: false,
          };

          const newBotMessage: Message = {
            id: newBotMessageId,
            role: "model",
            content: "",
            isStreaming: true,
            variants: [...existingVariants, oldVariant],
            createdAt: new Date().toISOString(),
          };

          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m, i) =>
                      i === modelIdx ? newBotMessage : m
                    ),
                    updatedAt: new Date().toISOString(),
                  }
                : c
            ),
          }));
        } else {
          // No model message exists yet, add new placeholder
          const newBotMessage: Message = {
            id: newBotMessageId,
            role: "model",
            content: "",
            isStreaming: true,
            createdAt: new Date().toISOString(),
          };

          set((s) => ({
            conversations: s.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: [
                      ...c.messages.slice(0, modelIdx),
                      newBotMessage,
                      ...c.messages.slice(modelIdx),
                    ],
                    updatedAt: new Date().toISOString(),
                  }
                : c
            ),
          }));
        }

        return { userMessage, newBotMessageId };
      },

      setIsStreaming: (value) => set({ isStreaming: value }),

      getActiveConversation: () => {
        const state = get();
        return state.conversations.find(
          (c) => c.id === state.activeConversationId
        );
      },
    }),
    {
      name: "kodingbuddy-chat",
      partialize: (state) => ({
        conversations: state.conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            attachments: m.attachments?.map((a) => ({
              ...a,
              // Keep base64 for images under ~300KB to survive refresh
              data: a.type === "image" && a.data.length < 300_000 ? a.data : "",
              previewUrl: undefined,
            })),
          })),
        })),
        activeConversationId: state.activeConversationId,
      }),
    }
  )
);
