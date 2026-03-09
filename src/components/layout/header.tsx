"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, MessageSquarePlus } from "lucide-react";

import { SettingsPanel } from "@/components/settings/settings-panel";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useChatStore } from "@/store/use-chat-store";

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-11 overflow-hidden rounded-2xl bg-white shadow-[0_12px_30px_rgba(14,165,233,0.12)] ring-1 ring-sky-100">
        <Image src="/logomark.png" alt="Gliss logo" fill className="object-contain p-1.5" priority />
      </div>
      <div className="relative h-8 w-[132px] sm:w-[156px]">
        <Image src="/wordmark.png" alt="Gliss" fill className="object-contain object-left" priority />
      </div>
    </div>
  );
}

export function Header() {
  const { activeChatId, chats, activeView, createChat } = useChatStore();
  const [navOpen, setNavOpen] = useState(false);
  const activeChat = activeChatId ? chats[activeChatId] : null;

  const heading =
    activeView === "chat"
      ? activeChat?.title ?? "New Chat"
      : activeView === "saved-lessons"
        ? "Saved Lessons"
        : "Council Activity";

  const subheading =
    activeView === "chat"
      ? "Readable, tool-ready language support"
      : activeView === "saved-lessons"
        ? "Review and reuse your saved study material"
        : "Inspect every council run, critique, and tool call";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-[rgba(249,250,251,0.82)] px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="lg:hidden">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger render={<Button variant="ghost" size="icon" className="rounded-2xl" aria-label="Open workspace navigation" />}>
                <Menu className="size-4" />
              </SheetTrigger>
              <SheetContent side="left" className="w-[92vw] max-w-sm border-r border-border/70 bg-[rgba(249,250,251,0.97)] p-4">
                <SheetHeader className="px-0 pb-4">
                  <SheetTitle>Workspace</SheetTitle>
                </SheetHeader>
                <WorkspaceNav compact onNavigate={() => setNavOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>
          <BrandLockup />
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-semibold text-foreground">{heading}</p>
            <p className="truncate text-sm text-muted-foreground">{subheading}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => createChat()} className="rounded-2xl">
            <MessageSquarePlus className="size-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <SettingsPanel />
        </div>
      </div>
    </header>
  );
}
