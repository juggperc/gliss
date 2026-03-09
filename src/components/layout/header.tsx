"use client";

import { useState } from "react";
import { Menu, MessageSquarePlus } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useChatStore } from "@/store/use-chat-store";

export function Header() {
  const { createChat } = useChatStore();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-2xl" aria-label="Open workspace navigation">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[92vw] max-w-sm border-r border-border bg-background p-4">
              <SheetHeader className="px-0 pb-4">
                <SheetTitle className="sr-only">Workspace</SheetTitle>
                <BrandLockup />
              </SheetHeader>
              <WorkspaceNav compact onNavigate={() => setNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <BrandLockup compact />
        </div>

        <div className="hidden lg:block" />

        <div className="ml-auto flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => createChat()} className="rounded-2xl bg-background">
            <MessageSquarePlus className="size-4" />
            <span className="hidden sm:inline">New Chat</span>
          </Button>
          <ThemeToggle />
          <SettingsPanel />
        </div>
      </div>
    </header>
  );
}
