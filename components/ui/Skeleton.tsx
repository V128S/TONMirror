"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

/** Dual-theme skeleton: phosphor flicker in terminal, glass flicker otherwise. */
export function Skeleton({ className }: { className?: string }) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <div
        className={cn("bg-phos/5 border border-phos-border-dim tm-flicker", className)}
      />
    );
  }

  return (
    <div
      className={cn("rounded-xl", className)}
      style={{
        background: "var(--chip)",
        border: "0.5px solid var(--glass-edge)",
        animation: "gl-flicker 1.6s ease-in-out infinite",
      }}
    />
  );
}
