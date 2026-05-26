"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

type Variant = "muted" | "info" | "success" | "warning" | "danger";

// ── Terminal badge styles ──────────────────────────────────────────────
const TERM_VARIANTS: Record<Variant, string> = {
  muted:   "border-phos-border-dim text-phos-mid",
  info:    "border-phos-border-dim text-phos-soft",
  success: "border-phos text-phos-hi",
  warning: "border-warn/55 text-warn",
  danger:  "border-danger/55 text-danger",
};

// ── Glass badge styles ─────────────────────────────────────────────────
function glassStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "success":
      return { background: "rgb(var(--text1))", color: "rgb(var(--bg))", border: "0.5px solid rgb(var(--text1))" };
    case "info":
    case "warning":
      return { background: "var(--glass-hi)", color: "rgb(var(--text1))", border: "0.5px solid var(--glass-edge)" };
    case "danger":
      return { background: "var(--chip)", color: "rgb(var(--text2))", border: "0.5px solid var(--glass-edge)" };
    default:
      return { background: "var(--glass)", color: "rgb(var(--text2))", border: "0.5px solid var(--glass-edge)" };
  }
}

export function Badge({
  variant = "muted",
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <span
        className={cn("tm-mono inline-block px-1.5 py-0.5 text-[9px] tracking-[0.12em] border uppercase", TERM_VARIANTS[variant], className)}
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn("inline-block rounded-full px-2.5 py-0.5", className)}
      style={{
        fontSize: 10, fontWeight: 500, letterSpacing: "0.01em",
        WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
        ...glassStyle(variant),
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: string }) {
  const { theme } = useTheme();
  const map: Record<string, { v: Variant; glyph: string; label: string }> = {
    accepted: { v: "success", glyph: "◆", label: theme === "terminal" ? "ACCEPT" : "Accepted" },
    review:   { v: "warning", glyph: "◇", label: theme === "terminal" ? "REVIEW" : "Review" },
    rejected: { v: "danger",  glyph: "✕", label: theme === "terminal" ? "REJECT" : "Rejected" },
  };
  const m = map[decision] ?? { v: "muted" as const, glyph: "·", label: decision };
  return <Badge variant={m.v}>{m.glyph} {m.label}</Badge>;
}

export function RiskBadge({ score }: { score: number }) {
  const v: Variant = score <= 3 ? "success" : score <= 6 ? "warning" : "danger";
  const { theme } = useTheme();
  return <Badge variant={v}>{theme === "terminal" ? `RISK ${score.toFixed(1)}/10` : `Risk ${score.toFixed(1)}/10`}</Badge>;
}
