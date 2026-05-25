"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant;
  size?:      ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:   "bg-ton-500 hover:bg-ton-600 text-white border-transparent",
  secondary: "bg-surface-2 hover:bg-surface-3 text-text-primary border-surface-border",
  ghost:     "bg-transparent hover:bg-surface-2 text-text-primary border-transparent",
  danger:    "bg-danger hover:bg-red-600 text-white border-transparent",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-xl",
  md: "px-4 py-2.5 text-sm rounded-2xl",
  lg: "px-6 py-3.5 text-base rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", isLoading, fullWidth, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium border transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98] transition-transform",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {isLoading && (
        <span className="size-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";
