"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

interface BrandLockupProps {
  compact?: boolean;
  className?: string;
}

export function BrandLockup({ compact = false, className }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className={cn("relative overflow-hidden rounded-[1.15rem] border border-border/70 bg-card shadow-sm", compact ? "size-11" : "size-14")}>
        <Image src="/logomark.png" alt="Gliss logo" fill className="object-contain p-1" priority />
      </div>
      {!compact ? (
        <div className="relative h-14 w-[220px] sm:w-[252px]">
          <Image src="/wordmark.png" alt="Gliss" fill className="object-contain object-left" priority />
        </div>
      ) : null}
    </div>
  );
}
