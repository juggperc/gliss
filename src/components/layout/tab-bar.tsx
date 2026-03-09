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
    <footer className="border-t border-border bg-background/92 px-4 py-3 backdrop-blur ios-safe-bottom lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="no-scrollbar momentum-scroll mx-auto flex max-w-full items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              type="button"
              variant={activeView === tab.id ? "aurora" : "aurora-muted"}
              onClick={() => setActiveView(tab.id)}
              className="min-w-[94px] rounded-[1rem] px-3.5 sm:min-w-[118px] sm:px-4"
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </Button>
          ))}
        </div>
        <div className="hidden items-center gap-2 rounded-[1rem] border border-border/70 bg-muted/60 px-3 py-2 text-sm text-muted-foreground md:flex">
          <Sparkles className="size-4" />
          <span>{formatUsd(totalSpend)}</span>
        </div>
      </div>
    </footer>
  );
}
