"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 border-r border-border/70 bg-white/72 px-4 py-4 backdrop-blur-xl lg:flex lg:flex-col",
        collapsed ? "w-[116px]" : "w-[348px]",
      )}
    >
      <div className="mb-4 flex items-center justify-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed((value) => !value)}
          className="rounded-full"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </Button>
      </div>

      {collapsed ? (
        <div className="flex flex-1 items-start justify-center">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="rounded-2xl"
            aria-label="Open workspace navigation"
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      ) : (
        <WorkspaceNav />
      )}
    </aside>
  );
}
