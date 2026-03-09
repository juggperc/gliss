"use client";

import { BrainCircuit, BookMarked, MessageSquareMore, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useChatStore } from "@/store/use-chat-store";

function formatUsd(value: number) {
  return `$${value.toFixed(value < 0.01 ? 4 : 2)}`;
}

export function TabBar() {
  const { activeView, setActiveView, chats } = useChatStore();

  const totalSpend = Object.values(chats).reduce((total, chat) => {
    return total + chat.messages.reduce((messageTotal, message) => messageTotal + (message.meta?.usage?.estimatedCostUsd ?? 0), 0);
  }, 0);

  const tabs = [
    { id: "chat" as const, label: "Chat", icon: MessageSquareMore },
    { id: "saved-lessons" as const, label: "Saved", icon: BookMarked },
    { id: "council-activity" as const, label: "Council", icon: BrainCircuit },
  ];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4 pt-2">
      <div className="pointer-events-auto flex w-full max-w-2xl items-center justify-between gap-2 rounded-[28px] border border-border/70 bg-[rgba(255,255,255,0.92)] px-3 py-2 shadow-[0_18px_60px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-1">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeView === tab.id ? "secondary" : "ghost"}
              onClick={() => setActiveView(tab.id)}
              className="flex-1 rounded-2xl"
            >
              <tab.icon className="size-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
        <div className="hidden items-center gap-2 rounded-2xl border border-border/70 bg-muted/60 px-3 py-2 text-sm text-muted-foreground sm:flex">
          <Sparkles className="size-4 text-sky-600" />
          <span>{formatUsd(totalSpend)}</span>
        </div>
      </div>
    </div>
  );
}
