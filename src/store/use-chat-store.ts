import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AppView,
  Chat,
  CouncilLogEntry,
  CouncilRun,
  MCPServer,
  Message,
  SavedLessonComponent,
  ToolEvent,
} from "@/lib/types";

type MessagePatch = Partial<Omit<Message, "meta">> & {
  meta?: Partial<NonNullable<Message["meta"]>>;
};

interface ChatStoreState {
  openRouterKey: string;
  mcpServers: MCPServer[];
  councilModels: string[];
  activeModel: string;
  activeView: AppView;

  chats: Record<string, Chat>;
  activeChatId: string | null;
  savedLessons: Record<string, SavedLessonComponent>;
  councilRuns: Record<string, CouncilRun>;

  setOpenRouterKey: (key: string) => void;
  addMcpServer: (server: MCPServer) => void;
  updateMcpServer: (id: string, patch: Partial<MCPServer>) => void;
  removeMcpServer: (id: string) => void;
  toggleMcpServer: (id: string, enabled: boolean) => void;
  setCouncilModels: (models: string[]) => void;
  setActiveModel: (model: string) => void;
  setActiveView: (view: AppView) => void;

  createChat: (title?: string) => string;
  ensureActiveChat: () => string;
  setActiveChat: (id: string) => void;
  deleteChat: (id: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  patchMessage: (chatId: string, messageId: string, patch: MessagePatch) => void;

  saveLessonComponent: (component: SavedLessonComponent) => void;
  removeSavedLesson: (id: string) => void;

  upsertCouncilRun: (run: CouncilRun) => void;
  patchCouncilRun: (runId: string, patch: Partial<CouncilRun>) => void;
  appendCouncilLog: (runId: string, log: CouncilLogEntry) => void;
  appendCouncilToolEvent: (runId: string, event: ToolEvent) => void;
}

function updateChat(chat: Chat, updater: (current: Chat) => Chat) {
  const next = updater(chat);
  return {
    ...next,
    updatedAt: Date.now(),
  };
}

function mergeMessagePatch(message: Message, patch: MessagePatch): Message {
  const { meta: metaPatch, ...messagePatch } = patch;
  const nextMeta: Message["meta"] =
    metaPatch && message.meta ? { ...message.meta, ...metaPatch } : message.meta;

  return {
    ...message,
    ...messagePatch,
    meta: nextMeta,
  };
}

export const useChatStore = create<ChatStoreState>()(
  persist(
    (set, get) => ({
      openRouterKey: "",
      mcpServers: [],
      councilModels: ["google/gemini-2.0-flash-001"],
      activeModel: "anthropic/claude-3.7-sonnet",
      activeView: "chat",

      chats: {},
      activeChatId: null,
      savedLessons: {},
      councilRuns: {},

      setOpenRouterKey: (key) => set({ openRouterKey: key }),
      addMcpServer: (server) =>
        set((state) => ({
          mcpServers: [...state.mcpServers, server],
        })),
      updateMcpServer: (id, patch) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((server) =>
            server.id === id ? { ...server, ...patch } : server,
          ),
        })),
      removeMcpServer: (id) =>
        set((state) => ({
          mcpServers: state.mcpServers.filter((server) => server.id !== id),
        })),
      toggleMcpServer: (id, enabled) =>
        set((state) => ({
          mcpServers: state.mcpServers.map((server) =>
            server.id === id ? { ...server, enabled } : server,
          ),
        })),
      setCouncilModels: (models) => set({ councilModels: models }),
      setActiveModel: (model) => set({ activeModel: model }),
      setActiveView: (view) => set({ activeView: view }),

      createChat: (title = "New Chat") => {
        const id = crypto.randomUUID();
        const chat: Chat = {
          id,
          title,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          chats: { ...state.chats, [id]: chat },
          activeChatId: id,
          activeView: "chat",
        }));

        return id;
      },
      ensureActiveChat: () => {
        const activeChatId = get().activeChatId;
        if (activeChatId && get().chats[activeChatId]) {
          return activeChatId;
        }

        return get().createChat();
      },
      setActiveChat: (id) => set({ activeChatId: id, activeView: "chat" }),
      deleteChat: (id) =>
        set((state) => {
          const chats = { ...state.chats };
          delete chats[id];

          const remainingChatIds = Object.keys(chats);
          return {
            chats,
            activeChatId:
              state.activeChatId === id
                ? remainingChatIds[0] ?? null
                : state.activeChatId,
          };
        }),
      addMessage: (chatId, message) =>
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) {
            return state;
          }

          const nextTitle =
            chat.messages.length === 0 && message.role === "user"
              ? `${message.content.slice(0, 40)}${message.content.length > 40 ? "..." : ""}`
              : chat.title;

          return {
            chats: {
              ...state.chats,
              [chatId]: updateChat(chat, (current) => ({
                ...current,
                title: nextTitle,
                messages: [...current.messages, message],
              })),
            },
          };
        }),
      patchMessage: (chatId, messageId, patch) =>
        set((state) => {
          const chat = state.chats[chatId];
          if (!chat) {
            return state;
          }

          return {
            chats: {
              ...state.chats,
              [chatId]: updateChat(chat, (current) => ({
                ...current,
                messages: current.messages.map((message) =>
                  message.id === messageId ? mergeMessagePatch(message, patch) : message,
                ),
              })),
            },
          };
        }),

      saveLessonComponent: (component) =>
        set((state) => ({
          savedLessons: {
            ...state.savedLessons,
            [component.id]: component,
          },
        })),
      removeSavedLesson: (id) =>
        set((state) => {
          const savedLessons = { ...state.savedLessons };
          delete savedLessons[id];
          return { savedLessons };
        }),

      upsertCouncilRun: (run) =>
        set((state) => ({
          councilRuns: {
            ...state.councilRuns,
            [run.id]: run,
          },
        })),
      patchCouncilRun: (runId, patch) =>
        set((state) => {
          const current = state.councilRuns[runId];
          if (!current) {
            return state;
          }

          return {
            councilRuns: {
              ...state.councilRuns,
              [runId]: {
                ...current,
                ...patch,
              },
            },
          };
        }),
      appendCouncilLog: (runId, log) =>
        set((state) => {
          const current = state.councilRuns[runId];
          if (!current) {
            return state;
          }

          return {
            councilRuns: {
              ...state.councilRuns,
              [runId]: {
                ...current,
                logs: [...current.logs, log],
              },
            },
          };
        }),
      appendCouncilToolEvent: (runId, event) =>
        set((state) => {
          const current = state.councilRuns[runId];
          if (!current) {
            return state;
          }

          return {
            councilRuns: {
              ...state.councilRuns,
              [runId]: {
                ...current,
                toolEvents: [...current.toolEvents, event],
              },
            },
          };
        }),
    }),
    {
      name: "gliss-storage",
      version: 2,
    },
  ),
);
