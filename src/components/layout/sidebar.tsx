"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { BrandLockup } from "@/components/layout/brand-lockup";
import { WorkspaceNav } from "@/components/layout/workspace-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden h-dvh shrink-0 border-r border-border bg-sidebar/96 px-4 py-4 transition-[width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:flex lg:flex-col",
        collapsed ? "w-[116px]" : "w-[348px]",
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-3 px-2">
        {collapsed ? <BrandLockup compact /> : <BrandLockup />}
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
