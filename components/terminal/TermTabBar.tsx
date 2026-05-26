"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home",      label: "HOME", glyph: "⌂" },
  { href: "/leaders",   label: "LEAD", glyph: "⌬" },
  { href: "/activity",  label: "TAPE", glyph: "≡" },
  { href: "/portfolio", label: "PORT", glyph: "◧" },
  { href: "/settings",  label: "CONF", glyph: "⚙" },
];

export function TermTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[66px] bg-bg border-t border-phos-border safe-area-pb flex items-center justify-around tm-mono">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 w-14 ${
              active ? "text-phos-hi" : "text-phos-mid"
            }`}
            style={active ? { textShadow: "0 0 6px #00ff66" } : undefined}
          >
            <span className="text-[18px] leading-none">{t.glyph}</span>
            <span className="text-[9px] tracking-[0.15em] font-bold">{t.label}</span>
            {active && (
              <span
                className="block w-[18px] h-[2px] bg-phos"
                style={{ boxShadow: "0 0 6px #00ff66" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
