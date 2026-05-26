"use client";

import type { ReactNode } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

export function PageTitle({
  overline,
  title,
  right,
}: {
  overline?: string;
  title: string;
  right?: ReactNode;
}) {
  const { theme } = useTheme();
  const isDark = theme === "glass-dark";

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
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            /* Gradient text: subtle on dark, strong on light */
            background: isDark
              ? "linear-gradient(135deg, #ffffff 60%, rgba(255,255,255,0.55) 100%)"
              : "linear-gradient(135deg, rgb(var(--text1)) 0%, rgb(var(--text2)) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {title}
        </h1>
      </div>
      {right && <div style={{ marginBottom: 2 }}>{right}</div>}
    </div>
  );
}
