"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandLockupProps {
  compact?: boolean;
  className?: string;
}

export function BrandLockup({ compact = false, className }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-[1.25rem] border border-border/70 bg-card shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          compact ? "size-11" : "size-16",
        )}
      >
        <Image src="/logomark.png" alt="Gliss logo" fill className="object-contain p-1" priority />
      </div>
    </div>
  );
}
