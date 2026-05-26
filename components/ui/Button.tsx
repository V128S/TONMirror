"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

// ── Terminal button styles ─────────────────────────────────────────────
const TERM_VARIANTS: Record<Variant, string> = {
  primary:   "bg-phos text-black hover:bg-phos-soft active:bg-phos shadow-glow",
  secondary: "bg-transparent border border-phos text-phos-hi hover:bg-phos/10",
  danger:    "bg-transparent border border-danger text-danger hover:bg-danger/10",
  ghost:     "bg-transparent text-phos-soft hover:text-phos-hi",
};
const TERM_SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px] tracking-[0.15em]",
  md: "px-4 py-2 text-[12px] tracking-[0.2em]",
  lg: "px-6 py-3 text-[13px] tracking-[0.25em]",
};

// ── Glass button styles ────────────────────────────────────────────────
const GLASS_SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[12px]",
  md: "px-4 py-2.5 text-[13px]",
  lg: "px-6 py-3.5 text-[15px]",
};

function glassButtonStyle(variant: Variant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return {
        background: "rgb(var(--text1))",
        color: "rgb(var(--bg))",
        boxShadow: "0 8px 22px -6px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.15) inset",
        border: "0.5px solid rgb(var(--text1))",
      };
    case "secondary":
      return {
        background: "var(--glass-hi)",
        color: "rgb(var(--text1))",
        border: "0.5px solid var(--glass-edge)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
      };
    case "danger":
      return {
        background: "var(--glass)",
        color: "rgb(var(--text2))",
        border: "0.5px solid var(--glass-edge)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
      };
    default:
      return { background: "transparent", color: "rgb(var(--text2))" };
  }
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({ variant = "primary", size = "md", fullWidth, className, style, ...props }: ButtonProps) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <button
        className={cn(
          "tm-mono font-bold transition-all uppercase",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          TERM_VARIANTS[variant],
          TERM_SIZES[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <button
      className={cn(
        "font-semibold rounded-full transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        GLASS_SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      style={{ ...glassButtonStyle(variant), ...style }}
      {...props}
    />
  );
}
