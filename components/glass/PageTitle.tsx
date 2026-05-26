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
    <div className="px-5 pt-3 pb-4 flex items-end justify-between">
      <div>
        {overline && (
          <div
            className="text-subtle"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 3,
              opacity: 0.55,
            }}
          >
            {overline}
          </div>
        )}
        <h1
          className="text-fg"
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ marginBottom: 2 }}>{right}</div>}
    </div>
  );
}
