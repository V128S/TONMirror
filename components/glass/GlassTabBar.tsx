"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Glass } from "./Glass";
import { useTheme } from "@/components/theme/ThemeProvider";

type IconRender = (active: boolean) => React.ReactNode;

const TABS: { href: string; label: string; tourId: string; icon: IconRender }[] = [
  {
    href: "/home", label: "Mirror", tourId: "tab-mirror",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>
        <line x1="12" y1="5" x2="12" y2="19" strokeDasharray="1 2"/>
      </svg>
    ),
  },
  {
    href: "/market", label: "Discover", tourId: "tab-market",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="18" x2="8" y2="12"/><line x1="8" y1="12" x2="12" y2="15"/>
        <line x1="12" y1="15" x2="16" y2="8"/><line x1="16" y1="8" x2="20" y2="5"/>
        <circle cx="20" cy="5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    href: "/activity", label: "Activity", tourId: "tab-activity",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="7" x2="20" y2="7"/>
        <line x1="4" y1="12" x2="16" y2="12"/>
        <line x1="4" y1="17" x2="12" y2="17"/>
      </svg>
    ),
  },
];

export function GlassTabBar() {
  const pathname  = usePathname();
  const { theme } = useTheme();
  const isDark    = theme === "glass-dark";

  return (
    <div className="fixed bottom-5 left-3.5 right-3.5 z-50 safe-area-pb">
      <Glass hi padding={5} className="flex items-center justify-between rounded-[28px]">
        {TABS.map((t) => {
          const active = pathname?.startsWith(t.href);

          const activeBg     = isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.90)";
          const activeShadow = isDark
            ? "0 1px 0 rgba(255,255,255,0.14) inset"
            : "0 1px 0 var(--glass-edge) inset, 0 4px 12px -4px rgba(0,0,0,0.12)";
          const activeColor   = isDark ? "rgb(var(--text1))" : "rgb(10,10,12)";
          const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgb(var(--text3))";

          return (
            <Link
              key={t.href}
              href={t.href}
              data-tour={t.tourId}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[22px] transition-colors"
              style={{
                background: active ? activeBg : "transparent",
                boxShadow:  active ? activeShadow : undefined,
                color:      active ? activeColor : inactiveColor,
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
