"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { Glass } from "@/components/glass/Glass";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  children?: ReactNode;
}

/** Dual-theme card: terminal panel in terminal mode, glass surface in glass mode. */
export function Card({ elevated, className, children, ...rest }: CardProps) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <div
        className={cn(
          "border bg-bg-panel p-3",
          elevated ? "border-phos-border shadow-panel-inset" : "border-phos-border-dim",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <Glass hi={elevated} className={cn("rounded-[22px] p-4", className)} {...rest}>
      {children}
    </Glass>
  );
}

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const { theme } = useTheme();
  return (
    <div className={cn(theme === "terminal" ? "mb-2" : "mb-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const { theme } = useTheme();
  if (theme === "terminal") {
    return (
      <div className={cn("tm-disp text-phos-hi text-[12px] tracking-[0.18em] uppercase tm-glow-soft", className)} {...rest}>
        {children}
      </div>
    );
  }
  return (
    <div
      className={cn("text-fg", className)}
      style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...rest}>{children}</div>;
}
