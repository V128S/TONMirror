"use client";

import type { ReactNode } from "react";

/**
 * Bracket-cornered box. Use as a wrapper around any panel that needs the
 * HUD-style corner accents (small 1px brackets in each corner).
 */
export function CornerBox({
  children,
  className = "",
  color = "#00ff66",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const base = {
    position: "absolute" as const,
    width: 8,
    height: 8,
    borderColor: color,
    borderStyle: "solid" as const,
  };
  return (
    <div className={`relative ${className}`}>
      <span style={{ ...base, top: -1, left: -1,    borderWidth: "1px 0 0 1px" }} />
      <span style={{ ...base, top: -1, right: -1,   borderWidth: "1px 1px 0 0" }} />
      <span style={{ ...base, bottom: -1, left: -1, borderWidth: "0 0 1px 1px" }} />
      <span style={{ ...base, bottom: -1, right: -1,borderWidth: "0 1px 1px 0" }} />
      {children}
    </div>
  );
}
