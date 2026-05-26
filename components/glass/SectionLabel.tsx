"use client";

import type { ReactNode } from "react";

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex justify-between items-baseline px-1 pt-1 pb-2">
      <span
        className="text-muted uppercase"
        style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}
      >
        {children}
      </span>
      {right && <span className="text-subtle" style={{ fontSize: 12 }}>{right}</span>}
    </div>
  );
}
