"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode, CSSProperties } from "react";

interface GlassProps extends HTMLAttributes<HTMLDivElement> {
  /** Brighter fill for hero/elevated surfaces. */
  hi?: boolean;
  /** Override the default rounded-2xl. */
  radius?: number;
  /** Override padding (px). Falls through if you pass a className with p-*. */
  padding?: number;
  children?: ReactNode;
}

/**
 * Glass surface primitive.
 * `backdrop-filter: blur(24px) saturate(180%)` + translucent fill + hairline edge.
 * In dark mode the fill flips to a translucent white-on-black via the CSS vars.
 */
export function Glass({
  hi,
  radius,
  padding,
  className,
  style,
  children,
  ...rest
}: GlassProps) {
  const merged: CSSProperties = {
    background: hi ? "var(--glass-hi)" : "var(--glass)",
    borderRadius: radius,
    padding: padding,
    ...style,
  };
  return (
    <div
      className={cn(
        "relative border",
        "shadow-glass",
        "backdrop-blur-[24px] backdrop-saturate-[1.8]",
        !radius && "rounded-2xl",
        className,
      )}
      style={{
        ...merged,
        borderColor: "var(--glass-edge)",
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
