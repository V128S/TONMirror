"use client";

import { cn } from "@/lib/utils";

/** Skeleton — terminal-themed dashed loading placeholder. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-phos/5 border border-phos-border-dim tm-flicker",
        className,
      )}
    />
  );
}
