"use client";

import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "muted";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-3 text-text-primary",
  success: "bg-green-500/15 text-green-400",
  warning: "bg-yellow-500/15 text-yellow-400",
  danger:  "bg-red-500/15   text-red-400",
  info:    "bg-ton-500/15   text-ton-400",
  muted:   "bg-surface-2    text-text-muted",
};

export function Badge({ variant = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

/** Risk score badge: 1-3 low, 4-6 medium, 7-10 high */
export function RiskBadge({ score }: { score: number }) {
  const variant =
    score <= 3 ? "success" :
    score <= 6 ? "warning" :
    "danger";
  const label =
    score <= 3 ? "Low risk" :
    score <= 6 ? "Med risk" :
    "High risk";
  return <Badge variant={variant}>{label}</Badge>;
}

/** Decision badge */
export function DecisionBadge({ decision }: { decision: "accepted" | "rejected" | "manual_review" }) {
  const map = {
    accepted:      { variant: "success" as const, label: "Accepted" },
    rejected:      { variant: "danger"  as const, label: "Rejected" },
    manual_review: { variant: "warning" as const, label: "Review" },
  };
  const { variant, label } = map[decision];
  return <Badge variant={variant}>{label}</Badge>;
}
