"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PageTitle({
  overline,
  title,
  right,
  onTitleClick,
}: {
  overline?: string;
  title: string;
  right?: ReactNode;
  /** Tap handler on the title text (hidden terminal-theme gesture) */
  onTitleClick?: () => void;
}) {
  const pathname = usePathname();
  const showGear = pathname !== "/settings";

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
          onClick={onTitleClick}
          style={{
            fontSize: 34,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.0,
            cursor: onTitleClick ? "pointer" : undefined,
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        >
          {title}
        </h1>
      </div>
      <div style={{ marginBottom: 2 }} className="flex items-center gap-1">
        {right && <div>{right}</div>}
        {showGear && (
          <Link
            href="/settings"
            aria-label="Settings"
            data-tour="tab-settings"
            className="w-9 h-9 flex items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"
              className="text-fg" style={{ opacity: 0.7 }}>
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}
