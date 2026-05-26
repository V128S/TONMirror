"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type Variant = "muted" | "info" | "success" | "warning" | "danger";

const VARIANTS: Record<Variant, string> = {
  muted:   "border-phos-border-dim text-phos-mid",
  info:    "border-phos-border-dim text-phos-soft",
  success: "border-phos text-phos-hi",
  warning: "border-warn/55 text-warn",
  danger:  "border-danger/55 text-danger",
};

export function Badge({
  variant = "muted",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "tm-mono inline-block px-1.5 py-0.5 text-[9px] tracking-[0.12em] border uppercase",
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: string }) {
  const map: Record<string, { v: Variant; glyph: string; label: string }> = {
    accepted: { v: "success", glyph: "◆", label: "ACCEPT" },
    review:   { v: "warning", glyph: "◇", label: "REVIEW" },
    rejected: { v: "danger",  glyph: "✕", label: "REJECT" },
  };
  const m = map[decision] ?? { v: "muted" as const, glyph: "·", label: decision };
  return (
    <Badge variant={m.v}>
      {m.glyph} {m.label}
    </Badge>
  );
}

export function RiskBadge({ score }: { score: number }) {
  const v: Variant = score <= 3 ? "success" : score <= 6 ? "warning" : "danger";
  return <Badge variant={v}>RISK {score.toFixed(1)}/10</Badge>;
}
