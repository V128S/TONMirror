"use client";

import type { ReactNode } from "react";

export function PageTitle({
  overline,
  title,
  right,
}: {
  overline?: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="px-5 pt-2 pb-3.5 flex items-end justify-between">
      <div>
        {overline && (
          <div className="text-subtle" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.02em", marginBottom: 2 }}>
            {overline}
          </div>
        )}
        <h1 className="text-fg" style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05 }}>
          {title}
        </h1>
      </div>
      {right}
    </div>
  );
}
