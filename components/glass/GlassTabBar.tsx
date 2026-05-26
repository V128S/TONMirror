"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glass } from "./Glass";

type IconRender = (active: boolean) => React.ReactNode;

const TABS: { href: string; label: string; icon: IconRender }[] = [
  {
    href: "/home", label: "Mirror",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>
        <line x1="12" y1="5" x2="12" y2="19" strokeDasharray="1 2"/>
      </svg>
    ),
  },
  {
    href: "/leaders", label: "Leaders",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6"/>
      </svg>
    ),
  },
  {
    href: "/activity", label: "Activity",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="12" x2="19" y2="12"/>
        <line x1="5" y1="16" x2="14" y2="16"/>
      </svg>
    ),
  },
  {
    href: "/portfolio", label: "Vault",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="14" rx="2"/>
        <line x1="4" y1="10" x2="20" y2="10"/>
        <circle cx="9" cy="14.5" r="1.2"/>
      </svg>
    ),
  },
  {
    href: "/settings", label: "Settings",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
      </svg>
    ),
  },
];

/**
 * Floating glass tab bar — fixed at bottom, ~20px inset from screen edges.
 * Active tab gets a brighter inner pill with a soft drop shadow; inactive
 * tabs fade to the muted text token.
 */
export function GlassTabBar() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-5 left-3.5 right-3.5 z-50 safe-area-pb">
      <Glass hi padding={5} className="flex items-center justify-between rounded-[28px]">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[22px] transition-colors"
              style={{
                background: active ? "rgba(255,255,255,0.9)" : "transparent",
                boxShadow: active
                  ? "0 1px 0 var(--glass-edge) inset, 0 4px 12px -4px rgba(0,0,0,0.12)"
                  : undefined,
                color: active ? "rgb(var(--text1))" : "rgb(var(--text3))",
              }}
            >
              {t.icon(!!active)}
              <span style={{ fontSize: 9.5, fontWeight: active ? 600 : 500, letterSpacing: "0.01em" }}>
                {t.label}
              </span>
            </Link>
          );
        })}
      </Glass>
    </div>
  );
}
