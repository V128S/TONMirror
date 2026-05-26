"use client";

import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:   "bg-phos text-black hover:bg-phos-soft active:bg-phos shadow-glow",
  secondary: "bg-transparent border border-phos text-phos-hi hover:bg-phos/10",
  danger:    "bg-transparent border border-danger text-danger hover:bg-danger/10",
  ghost:     "bg-transparent text-phos-soft hover:text-phos-hi",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[11px] tracking-[0.15em]",
  md: "px-4 py-2 text-[12px] tracking-[0.2em]",
  lg: "px-6 py-3 text-[13px] tracking-[0.25em]",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "tm-mono font-bold transition-all uppercase",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}
