"use client";

import { BrainCircuit, BookMarked, MessageSquareMore, MessageSquarePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/use-chat-store";

interface WorkspaceNavProps {
  compact?: boolean;
  onNavigate?: () => void;
}

export function WorkspaceNav({ compact = false, onNavigate }: WorkspaceNavProps) {
  const {
    chats,
    activeChatId,
    activeView,
    createChat,
    setActiveChat,
    deleteChat,
    setActiveView,
    savedLessons,
    councilRuns,
  } = useChatStore();

  const chatList = Object.values(chats).sort((left, right) => right.updatedAt - left.updatedAt);
  const savedLessonCount = Object.keys(savedLessons).length;
  const councilRunCount = Object.keys(councilRuns).length;

  return (
    <div className="flex h-full flex-col gap-5">
      <div className="rounded-[28px] border border-border/70 bg-card/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <Button
          type="button"
          onClick={() => {
            createChat();
            onNavigate?.();
          }}
          className="w-full justify-start rounded-2xl"
        >
          <MessageSquarePlus className="size-4" />
          New Chat
        </Button>
      </div>

      <div className="rounded-[28px] border border-border/70 bg-card/80 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <p className="px-2 pb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Workspace</p>
        <div className="space-y-1.5">
          <Button
            type="button"
            variant={activeView === "chat" ? "secondary" : "ghost"}
            onClick={() => {
              setActiveView("chat");
              onNavigate?.();
            }}
            className="w-full justify-start rounded-2xl"
          >
            <MessageSquareMore className="size-4" />
            Chat
          </Button>
          <Button
            type="button"
            variant={activeView === "saved-lessons" ? "secondary" : "ghost"}
            onClick={() => {
              setActiveView("saved-lessons");
              onNavigate?.();
            }}
            className="w-full justify-between rounded-2xl"
          >
            <span className="flex items-center gap-2">
              <BookMarked className="size-4" />
              Saved Lessons
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{savedLessonCount}</span>
          </Button>
          <Button
            type="button"
            variant={activeView === "council-activity" ? "secondary" : "ghost"}
            onClick={() => {
              setActiveView("council-activity");
              onNavigate?.();
            }}
            className="w-full justify-between rounded-2xl"
          >
            <span className="flex items-center gap-2">
              <BrainCircuit className="size-4" />
              Council Activity
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{councilRunCount}</span>
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 rounded-[28px] border border-border/70 bg-card/80 p-3 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between px-2 pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Recent Chats</p>
          <span className="text-xs text-muted-foreground">{chatList.length}</span>
        </div>

        {chatList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm leading-7 text-muted-foreground">
            Your conversations will show up here once you start chatting.
          </div>
        ) : (
          <div className="momentum-scroll space-y-1.5 overflow-y-auto pr-1">
            {chatList.map((chat) => (
              <div key={chat.id} className="group flex items-center gap-2 rounded-2xl border border-transparent px-2 py-1 transition hover:border-border/70 hover:bg-muted/40">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setActiveChat(chat.id);
                    onNavigate?.();
                  }}
                  className={cn(
                    "min-w-0 flex-1 justify-start rounded-xl px-3",
                    activeChatId === chat.id && activeView === "chat" ? "bg-secondary" : "",
                  )}
                >
                  <span className="truncate">{chat.title}</span>
                </Button>
                {!compact ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => deleteChat(chat.id)}
                    className="rounded-full opacity-0 transition group-hover:opacity-100"
                    aria-label={`Delete ${chat.title}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
