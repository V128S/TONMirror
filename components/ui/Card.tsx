"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  children?: ReactNode;
}

/** Terminal panel: thin phosphor border on bg.panel. `elevated` adds inset glow. */
export function Card({ elevated, className, children, ...rest }: CardProps) {
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

export function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-2", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "tm-disp text-phos-hi text-[12px] tracking-[0.18em] uppercase tm-glow-soft",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...rest}>
      {children}
    </div>
  );
}
