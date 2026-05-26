# UX & Navigation Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure navigation to 4 tabs (Mirror | Market | Portfolio | Settings), add onboarding (welcome screens + spotlight tour), add leader Bottom Sheet, add wallet balance to Portfolio, fix dark-mode inactive tab color.

**Architecture:** Pure UI layer — no new API routes or DB changes. New `/market` route unifies leaders list + activity feed with an internal tab switcher. A `useTonBalance` hook fetches from `tonapi.io` when wallet + API key are present and falls back to trade approximation. Onboarding state is stored in `localStorage`. `BottomSheet` is a new shared primitive component.

**Tech Stack:** Next.js 15 App Router, React `useState/useEffect`, TanStack Query, TON Connect (`useTonAddress`), Tailwind CSS, Liquid Glass + Terminal dual-theme.

---

## File Map

| Action | Path | Purpose |
|---|---|---|
| Modify | `components/glass/GlassTabBar.tsx` | 5→4 tabs, fix inactive color, add `data-tour` |
| Modify | `components/terminal/TermTabBar.tsx` | 5→4 tabs, add `data-tour` |
| Create | `app/(tabs)/market/page.tsx` | Unified Leaders+Activity page with tab switcher |
| Modify | `app/(tabs)/leaders/page.tsx` | Replace with redirect to `/market` |
| Modify | `app/(tabs)/activity/page.tsx` | Replace with redirect to `/market?tab=activity` |
| Create | `hooks/useTonBalance.ts` | TON balance fetcher with fallback |
| Modify | `app/(tabs)/portfolio/page.tsx` | Add wallet balance hero section |
| Create | `components/ui/BottomSheet.tsx` | Reusable slide-up panel primitive |
| Create | `components/onboarding/WelcomeScreens.tsx` | 3-slide welcome flow |
| Create | `components/onboarding/SpotlightTour.tsx` | 5-step highlight tour |
| Create | `components/onboarding/OnboardingManager.tsx` | Orchestrator reading localStorage |
| Modify | `app/(tabs)/layout.tsx` | Mount `<OnboardingManager />` |
| Modify | `app/(tabs)/settings/page.tsx` | Add "Show tour again" button |

---

## Task 1: Fix tab bar — 4 tabs + dark-mode inactive color

**Files:**
- Modify: `components/glass/GlassTabBar.tsx`
- Modify: `components/terminal/TermTabBar.tsx`

- [ ] **Step 1: Rewrite `GlassTabBar.tsx`**

Replace the entire file with:

```tsx
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
    href: "/market", label: "Market", tourId: "tab-market",
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
    href: "/portfolio", label: "Portfolio", tourId: "tab-portfolio",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
  },
  {
    href: "/settings", label: "Settings", tourId: "tab-settings",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
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
```

- [ ] **Step 2: Rewrite `TermTabBar.tsx`**

Replace the entire file:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/home",      label: "HOME", glyph: "⌂", tourId: "tab-mirror"    },
  { href: "/market",    label: "MKT",  glyph: "◈", tourId: "tab-market"    },
  { href: "/portfolio", label: "PORT", glyph: "◧", tourId: "tab-portfolio" },
  { href: "/settings",  label: "CONF", glyph: "⚙", tourId: "tab-settings"  },
];

export function TermTabBar() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[66px] bg-black border-t border-phos-border safe-area-pb flex items-center justify-around tm-mono">
      {TABS.map((t) => {
        const active = pathname?.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            data-tour={t.tourId}
            className={`flex flex-col items-center gap-0.5 w-14 ${
              active ? "text-phos-hi" : "text-phos-mid"
            }`}
            style={active ? { textShadow: "0 0 6px #00ff66" } : undefined}
          >
            <span className="text-[18px] leading-none">{t.glyph}</span>
            <span className="text-[9px] tracking-[0.15em] font-bold">{t.label}</span>
            {active && (
              <span className="block w-[18px] h-[2px] bg-phos"
                style={{ boxShadow: "0 0 6px #00ff66" }} />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add components/glass/GlassTabBar.tsx components/terminal/TermTabBar.tsx
git commit -m "feat: 4-tab nav (Mirror/Market/Portfolio/Settings) + fix dark inactive color"
```

---

## Task 2: Redirect old routes + create Market page

**Files:**
- Create: `app/(tabs)/market/page.tsx`
- Modify: `app/(tabs)/leaders/page.tsx`
- Modify: `app/(tabs)/activity/page.tsx`

- [ ] **Step 1: Create `app/(tabs)/market/` directory**

```bash
mkdir -p /path/to/project/app/\(tabs\)/market
```

- [ ] **Step 2: Write `app/(tabs)/market/page.tsx`**

This page takes the full glass and terminal content from both leaders and activity pages and combines them with an internal tab switcher. It also hooks leader cards to open a BottomSheet (defined in Task 3 — for now pass `onLeaderClick` as a no-op that will be wired up in Task 3).

```tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass imports ─────────────────────────────────────────────────────────
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Badge as GlassBadge, RiskBadge } from "@/components/ui/Badge";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";

// ── Terminal imports ──────────────────────────────────────────────────────
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { Sparkline }  from "@/components/fx/Sparkline";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { QuoteCard }  from "@/components/activity/QuoteCard";

import { formatPercent, formatUsd, formatAmount, formatRelativeTime } from "@/lib/format";
import { useLeaders } from "@/hooks/useLeaders";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityEvent } from "@/hooks/useActivity";
import type { Leader } from "@/hooks/useLeaders";
import { BottomSheet } from "@/components/ui/BottomSheet";

// ── Types ─────────────────────────────────────────────────────────────────
type MarketTab  = "leaders" | "activity";
type TermFilter = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";
type GlassFilter = "All" | "Accepted" | "Review" | "Rejected";
const GLASS_FILTER_MAP: Record<GlassFilter, string | null> = {
  All: null, Accepted: "accepted", Review: "review", Rejected: "rejected",
};

// ── Activity helpers (copied from activity/page.tsx) ──────────────────────
function ExecStatusGlyph({ status }: { status: string }) {
  const map: Record<string, { c: string; l: string }> = {
    pending:   { c: "#ffd500", l: "PEND" },
    quoted:    { c: "#00ffaa", l: "QUOTE" },
    ready:     { c: "#00ffaa", l: "READY" },
    submitted: { c: "#00ffaa", l: "SUBMIT" },
    confirmed: { c: "#c8ffd8", l: "OK" },
    failed:    { c: "#ff3050", l: "FAIL" },
    skipped:   { c: "#4a8a5e", l: "SKIP" },
  };
  const m = map[status] ?? { c: "#4a8a5e", l: status.toUpperCase() };
  return <span className="tm-mono text-[9px] tracking-[0.15em]" style={{ color: m.c }}>EXEC:{m.l}</span>;
}

function decTag(outcome: string) {
  return outcome === "accepted"
    ? { c: "#c8ffd8", g: "◆", l: "ACCEPT" }
    : outcome === "manual_review"
    ? { c: "#ffd500", g: "◇", l: "REVIEW" }
    : { c: "#ff3050", g: "✕", l: "REJECT" };
}

function decoFor(outcome: string | undefined) {
  switch (outcome) {
    case "accepted":     return { dot: "rgb(var(--text1))", label: "Accepted", w: 600 };
    case "manual_review":return { dot: "rgb(var(--text2))", label: "Review",   w: 500 };
    case "rejected":     return { dot: "rgb(var(--text3))", label: "Rejected", w: 500 };
    default:             return { dot: "rgb(var(--text4))", label: "Pending",  w: 500 };
  }
}

function TermEventRow({ event }: { event: ActivityEvent }) {
  const [showQuote, setShowQuote] = useState(false);
  const d = event.decision ? decTag(event.decision.outcome) : { c: "#4a8a5e", g: "·", l: "NONE" };
  const canQuote =
    event.execution !== null &&
    (event.execution.status === "pending" || event.execution.status === "quoted") &&
    event.decision !== null &&
    event.decision.outcome !== "rejected";
  return (
    <div>
      <div className="border border-phos-border-dim bg-bg-panel p-2.5">
        <div className="grid items-center gap-2" style={{ gridTemplateColumns: "52px 14px 1fr 70px" }}>
          <span className="text-phos-mid text-[10px] tm-mono">
            {new Date(event.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
          </span>
          <span className="text-[13px] font-bold" style={{ color: d.c }}>{d.g}</span>
          <div>
            <div className="text-[9px] text-phos-soft tracking-[0.08em]">{event.leader.nickname}</div>
            <div className="text-[11px] text-phos-hi tm-mono mt-0.5">
              {formatAmount(event.soldAmountDecimal)} {event.soldToken}{" "}
              <span className="text-phos-mid">→</span> {event.boughtToken}
            </div>
            {event.usdEstimate != null && (
              <div className="text-[9px] text-phos-mid mt-0.5 tm-mono">
                ≈ {formatUsd(event.usdEstimate)} · {formatRelativeTime(event.timestamp)}
              </div>
            )}
          </div>
          <div className="text-right">
            <DecisionBadge decision={event.decision?.outcome ?? "none"} />
            {event.execution && <div className="mt-1"><ExecStatusGlyph status={event.execution.status} /></div>}
          </div>
        </div>
        {event.decision && event.decision.riskFlags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pl-[68px]">
            {event.decision.riskFlags.map((f) => (
              <Badge key={f} variant="warning">⚠ {f.replace(/_/g, " ")}</Badge>
            ))}
          </div>
        )}
        {canQuote && (
          <div className="mt-2 pl-[68px]">
            <Button variant={showQuote ? "ghost" : "secondary"} size="sm" onClick={() => setShowQuote((p) => !p)}>
              {showQuote ? "▴ HIDE QUOTE" : "▸ GET QUOTE"}
            </Button>
          </div>
        )}
      </div>
      {showQuote && event.execution && event.decision && (
        <QuoteCard
          executionId={event.execution.id} soldToken={event.soldToken} boughtToken={event.boughtToken}
          plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
          slippageBps={100} onDismiss={() => setShowQuote(false)}
        />
      )}
    </div>
  );
}

function GlassEventRow({ event, last }: { event: ActivityEvent; last: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const d = decoFor(event.decision?.outcome);
  const usd = event.usdEstimate ?? 0;
  const up  = usd >= 0;
  const canQuote =
    event.execution !== null &&
    (event.execution.status === "pending" || event.execution.status === "quoted") &&
    event.decision !== null &&
    event.decision.outcome !== "rejected";
  return (
    <>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full text-left"
      >
        <div
          className="grid items-center gap-3 px-3.5 py-3.5"
          style={{
            gridTemplateColumns: "48px 1fr auto",
            borderBottom: last && !expanded ? "none" : "0.5px solid rgb(var(--hair) / 0.08)",
          }}
        >
          <div>
            <div className="font-mono text-subtle" style={{ fontSize: 11 }}>
              {new Date(event.timestamp).toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5)}
            </div>
            <div className="mt-1 flex items-center gap-1">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: d.dot }} />
              <span className="text-subtle" style={{ fontSize: 10, fontWeight: 500 }}>{d.label}</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-fg" style={{ fontSize: 13, fontWeight: 600 }}>
              {formatAmount(event.soldAmountDecimal)} {event.soldToken} → {event.boughtToken}
            </div>
            <div className="text-subtle" style={{ fontSize: 11, marginTop: 2 }}>
              {prettyName(event.leader.nickname)}
              <span className="text-faint"> · </span>
              {formatRelativeTime(event.timestamp)}
            </div>
          </div>
          <div className="text-right">
            <div className="gl-tnum" style={{
              fontSize: 14, fontWeight: d.w,
              color: event.decision?.outcome === "rejected" ? "rgb(var(--text3))" : "rgb(var(--text1))",
            }}>
              {event.usdEstimate != null ? `${up ? "+" : "−"}${formatUsd(Math.abs(usd))}` : "—"}
            </div>
            {event.execution && (
              <div className="text-subtle capitalize" style={{ fontSize: 10, marginTop: 2 }}>{event.execution.status}</div>
            )}
            <div className="text-faint" style={{ fontSize: 10, marginTop: 2 }}>{expanded ? "▲" : "▼"}</div>
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-3.5 pb-3 space-y-1.5"
          style={{ borderBottom: "0.5px solid rgb(var(--hair) / 0.08)" }}>
          <div className="text-subtle" style={{ fontSize: 12 }}>
            Sold: <span className="text-fg font-medium">{formatAmount(event.soldAmountDecimal)} {event.soldToken}</span>
          </div>
          <div className="text-subtle" style={{ fontSize: 12 }}>
            Bought: <span className="text-fg font-medium">{event.boughtToken}</span>
          </div>
          <div className="text-subtle" style={{ fontSize: 12 }}>
            DEX: <span className="text-fg font-medium">{event.dex}</span>
          </div>
          {event.decision && (
            <div className="flex items-center gap-2 pt-1">
              <DecisionBadge decision={event.decision.outcome} />
              {event.decision.reason && (
                <span className="text-subtle" style={{ fontSize: 11 }}>{event.decision.reason}</span>
              )}
            </div>
          )}
          {event.decision && event.decision.riskFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {event.decision.riskFlags.map((f) => (
                <span key={f} className="rounded-full px-2 py-0.5 text-muted"
                  style={{ fontSize: 10, background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
                  ⚠ {f.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          {canQuote && event.execution && event.decision && (
            <QuoteCard
              executionId={event.execution.id}
              soldToken={event.soldToken}
              boughtToken={event.boughtToken}
              plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
              slippageBps={100}
              onDismiss={() => setExpanded(false)}
            />
          )}
        </div>
      )}
    </>
  );
}

// ── Leader Bottom Sheet content ───────────────────────────────────────────
function LeaderSheetContent({ leader, onClose }: { leader: Leader; onClose: () => void }) {
  const spark = Array.from({ length: 7 }).map(
    (_, i) => 40 + i * 3 + Math.sin(i * 0.9 + leader.riskScore) * 10,
  );
  return (
    <div className="px-4 pb-4">
      <div className="grid items-center gap-3 mb-5" style={{ gridTemplateColumns: "52px 1fr auto" }}>
        <Avatar name={leader.nickname} size={52} />
        <div>
          <div className="text-fg" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {prettyName(leader.nickname)}
          </div>
          <div className="text-subtle mt-0.5" style={{ fontSize: 12 }}>
            {leader.address.slice(0, 6)}…{leader.address.slice(-4)}
          </div>
        </div>
        <RiskBadge score={leader.riskScore} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Win Rate", value: formatPercent(leader.winRateApprox) },
          { label: "Vol 30d",  value: leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : "—" },
          { label: "Trades",   value: leader.tradeCount30d != null ? String(leader.tradeCount30d) : "—" },
        ].map((s) => (
          <Glass key={s.label} radius={14} padding={10} className="text-center">
            <div className="text-subtle" style={{ fontSize: 10 }}>{s.label}</div>
            <div className="text-fg gl-tnum mt-1" style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </Glass>
        ))}
      </div>

      <GlassSparkline data={spark} width={undefined as unknown as number} height={52} className="mb-5" />

      <div className="space-y-2">
        <Link
          href={`/leaders/${leader.id}`}
          onClick={onClose}
          className="block w-full rounded-full py-3 text-center font-semibold transition-colors"
          style={{
            fontSize: 14,
            background: "rgb(var(--text1))",
            color: "rgb(var(--bg))",
            boxShadow: "0 8px 22px -6px rgba(0,0,0,0.3)",
          }}
        >
          Open full profile →
        </Link>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function MarketPage() {
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab]   = useState<MarketTab>(() =>
    searchParams?.get("tab") === "activity" ? "activity" : "leaders"
  );
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

  const { data: leaders, isLoading: lLoad, isError: lError } = useLeaders();
  const { data: events,  isLoading: eLoad, isError: eError  } = useActivity({ limit: 50 });
  const [termFilter, setTermFilter]   = useState<TermFilter>("ALL");
  const [glassFilter, setGlassFilter] = useState<GlassFilter>("All");

  // Sync tab from URL param on navigation (e.g. redirect from /activity)
  useEffect(() => {
    if (searchParams?.get("tab") === "activity") setActiveTab("activity");
  }, [searchParams]);

  /* ── Terminal ──────────────────────────────────────────────────────── */
  if (theme === "terminal") {
    const termFilterMap: Record<TermFilter, string | null> = {
      ALL: null, ACCEPT: "accepted", REVIEW: "manual_review", REJECT: "rejected",
    };
    const filteredEvents = events?.filter((e) => {
      const want = termFilterMap[termFilter];
      if (!want) return true;
      return e.decision?.outcome === want;
    }) ?? [];

    return (
      <div>
        <TermHeader title="MARKET" sub="leaders · tape · signals" />
        {/* Tab switcher */}
        <div className="flex gap-1 px-3 pt-2 pb-1">
          {(["leaders", "activity"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`flex-1 py-1.5 text-[9px] tracking-[0.15em] font-bold tm-mono ${
                activeTab === t
                  ? "border border-phos bg-phos/10 text-phos-hi"
                  : "border border-phos-border-dim text-phos-mid"
              }`}>
              ▸ {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Leaders sub-tab */}
        {activeTab === "leaders" && (
          <div className="px-4 pt-2 space-y-3">
            {lLoad ? (
              [1,2,3].map((i) => <div key={i} className="border border-phos-border-dim h-20 bg-phos/5 animate-pulse" />)
            ) : lError || !leaders ? (
              <div className="text-center py-12">
                <p className="tm-disp text-phos-hi text-lg">▲ ERR_DB ▲</p>
              </div>
            ) : leaders.map((leader) => {
              const spark = Array.from({ length: 16 }).map(
                (_, i) => 40 + i * 2 + Math.sin(i * 0.7 + leader.riskScore) * 8 + leader.activityScore * 10,
              );
              return (
                <Link key={leader.id} href={`/leaders/${leader.id}`} className="block">
                  <Card className="active:bg-phos/5 transition-colors">
                    <CardHeader>
                      <div className="flex flex-row items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <CardTitle>{leader.nickname}</CardTitle>
                            {leader.sourceType === "auto_discovered" && (
                              <Badge variant="success" className="text-[8px] px-1 py-0">AUTO</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {leader.tags.filter(t => t !== "auto").map((tag) => (
                              <Badge key={tag} variant="muted">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                        <RiskBadge score={leader.riskScore} />
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-3 gap-2 items-end">
                        <div>
                          <div className="text-[9px] text-phos-mid tracking-[0.15em]">WIN</div>
                          <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">{formatPercent(leader.winRateApprox)}</div>
                        </div>
                        <div>
                          <div className="text-[9px] text-phos-mid tracking-[0.15em]">VOL·30D</div>
                          <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">
                            {leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : formatPercent(leader.activityScore)}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <Sparkline data={spark} width={92} height={28} fill />
                        </div>
                      </div>
                    </CardBody>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-phos-border-dim">
                      {leader.isFollowing
                        ? <Badge variant="success">FOLLOWING ✓</Badge>
                        : <Badge variant="muted">▸ TAP TO FOLLOW</Badge>}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Activity sub-tab */}
        {activeTab === "activity" && (
          <div className="px-3 pt-2 space-y-2">
            <div className="flex gap-1">
              {(["ALL","ACCEPT","REVIEW","REJECT"] as const).map((f) => (
                <button key={f} onClick={() => setTermFilter(f)}
                  className={`flex-1 py-1.5 text-[9px] tracking-[0.15em] font-bold tm-mono ${
                    termFilter === f ? "border border-phos bg-phos/10 text-phos-hi" : "border border-phos-border-dim text-phos-mid"
                  }`}>▸ {f}</button>
              ))}
            </div>
            {eLoad ? (
              <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : eError ? (
              <div className="text-center py-12"><p className="tm-disp text-danger">▲ ERR_DB ▲</p></div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12"><p className="tm-disp text-phos-mid">▢ NO·EVENTS ▢</p></div>
            ) : (
              <div className="space-y-2">{filteredEvents.map((e) => <TermEventRow key={e.id} event={e} />)}</div>
            )}
            <div className="text-center text-[9px] text-phos-mid tm-mono pt-2">
              ─── END · OF · TAPE ··· <BlinkCaret /> ───
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Glass ─────────────────────────────────────────────────────────── */
  const filteredEvents = events?.filter((e) => {
    const want = GLASS_FILTER_MAP[glassFilter];
    if (!want) return true;
    return e.decision?.outcome === want;
  }) ?? [];

  return (
    <div>
      <PageTitle overline="Leaders & Activity" title="Market" />

      {/* Internal tab switcher */}
      <div className="px-4 mb-4">
        <div className="flex gap-1.5 p-1 rounded-[18px]"
          style={{ background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
          {(["leaders", "activity"] as const).map((t) => {
            const on = activeTab === t;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className="flex-1 rounded-[14px] py-2 transition-colors"
                style={{
                  fontSize: 13, fontWeight: on ? 600 : 500,
                  background: on ? "rgb(var(--text1))" : "transparent",
                  color: on ? "rgb(var(--bg))" : "rgb(var(--text2))",
                  boxShadow: on ? "0 2px 8px -2px rgba(0,0,0,0.2)" : undefined,
                }}>
                {t === "leaders" ? "Leaders" : "Activity"}
              </button>
            );
          })}
        </div>
      </div>

      {/* Leaders sub-tab */}
      {activeTab === "leaders" && (
        <div className="px-4 space-y-3">
          <SectionLabel right="By PnL · 30d">All leaders</SectionLabel>
          {lLoad ? (
            [1,2,3].map((i) => <GlassSkeleton key={i} className="h-28 rounded-[22px]" />)
          ) : lError || !leaders ? (
            <div className="text-center pt-12 text-subtle">Couldn&apos;t load leaders.</div>
          ) : leaders.length === 0 ? (
            <div className="text-center pt-12 text-subtle">No leaders yet. Run the seed script.</div>
          ) : leaders.map((leader) => {
            const spark = Array.from({ length: 16 }).map(
              (_, i) => 40 + i * 2 + Math.sin(i * 0.7 + leader.riskScore) * 8 + leader.activityScore * 10,
            );
            return (
              <button key={leader.id} className="w-full text-left" onClick={() => setSelectedLeader(leader)}>
                <Glass radius={22} padding={16}>
                  <div className="grid items-center gap-3" style={{ gridTemplateColumns: "44px 1fr auto" }}>
                    <Avatar name={leader.nickname} size={44} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="text-fg" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                          {prettyName(leader.nickname)}
                        </div>
                        {leader.sourceType === "auto_discovered" && (
                          <GlassBadge variant="success" className="text-[9px]">AUTO</GlassBadge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {leader.tags.filter(t => t !== "auto").slice(0, 3).map((tag) => (
                          <GlassBadge key={tag} variant="muted">{tag.toLowerCase()}</GlassBadge>
                        ))}
                      </div>
                    </div>
                    <RiskBadge score={leader.riskScore} />
                  </div>

                  <div className="mt-3.5 pt-3.5 grid items-end gap-2"
                    style={{ gridTemplateColumns: "1fr 1fr auto", borderTop: "0.5px solid rgb(var(--hair) / 0.06)" }}>
                    <div>
                      <div className="text-subtle" style={{ fontSize: 10 }}>Win rate</div>
                      <div className="text-fg gl-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                        {formatPercent(leader.winRateApprox)}
                      </div>
                    </div>
                    <div>
                      <div className="text-subtle" style={{ fontSize: 10 }}>Vol · 30d</div>
                      <div className="text-fg gl-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                        {leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : formatPercent(leader.activityScore)}
                      </div>
                    </div>
                    <GlassSparkline data={spark} width={92} height={32} />
                  </div>

                  <div className="mt-3 pt-2.5 flex items-center justify-between"
                    style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.06)" }}>
                    {leader.isFollowing
                      ? <GlassBadge variant="success">Following ✓</GlassBadge>
                      : <GlassBadge variant="muted">Tap to preview →</GlassBadge>}
                  </div>
                </Glass>
              </button>
            );
          })}
        </div>
      )}

      {/* Activity sub-tab */}
      {activeTab === "activity" && (
        <div className="px-4 space-y-3.5">
          <div className="flex gap-1.5 overflow-x-auto scroll-hide">
            {(["All","Accepted","Review","Rejected"] as GlassFilter[]).map((f) => {
              const on = glassFilter === f;
              return (
                <button key={f} onClick={() => setGlassFilter(f)}
                  className="rounded-full px-3.5 py-2 whitespace-nowrap transition-colors"
                  style={{
                    fontSize: 12, fontWeight: on ? 600 : 500,
                    background: on ? "rgb(var(--text1))" : "var(--glass)",
                    color: on ? "rgb(var(--bg))" : "rgb(var(--text2))",
                    border: on ? "0.5px solid rgb(var(--text1))" : "0.5px solid var(--glass-edge)",
                    WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
                  }}>
                  {f}
                </button>
              );
            })}
          </div>
          <div>
            <SectionLabel right={`${filteredEvents.length} events`}>Today</SectionLabel>
            <Glass radius={22} padding={0} className="overflow-hidden">
              {eLoad ? (
                <div className="p-3 space-y-2">{[1,2,3,4].map((i) => <GlassSkeleton key={i} className="h-14" />)}</div>
              ) : eError ? (
                <div className="text-center py-12 text-subtle">Couldn&apos;t load activity.</div>
              ) : filteredEvents.length === 0 ? (
                <div className="text-center py-12 text-subtle" style={{ fontSize: 12 }}>No events match this filter.</div>
              ) : (
                filteredEvents.map((e, i) => <GlassEventRow key={e.id} event={e} last={i === filteredEvents.length - 1} />)
              )}
            </Glass>
          </div>
          <div className="text-center text-subtle pt-1 pb-1" style={{ fontSize: 11 }}>End of feed</div>
        </div>
      )}

      {/* Leader bottom sheet */}
      <BottomSheet isOpen={selectedLeader !== null} onClose={() => setSelectedLeader(null)}>
        {selectedLeader && (
          <LeaderSheetContent leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
        )}
      </BottomSheet>
    </div>
  );
}
```

- [ ] **Step 3: Replace `app/(tabs)/leaders/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";
export default function LeadersPage() {
  redirect("/market");
}
```

- [ ] **Step 4: Replace `app/(tabs)/activity/page.tsx` with redirect**

```tsx
import { redirect } from "next/navigation";
export default function ActivityPage() {
  redirect("/market?tab=activity");
}
```

- [ ] **Step 5: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: errors only about missing `BottomSheet` import (not yet created). All other errors must be zero.

- [ ] **Step 6: Commit (before BottomSheet exists, so skip build)**

```bash
git add app/\(tabs\)/market/ app/\(tabs\)/leaders/page.tsx app/\(tabs\)/activity/page.tsx
git commit -m "feat: /market page with Leaders+Activity tab switcher + inline expand"
```

---

## Task 3: BottomSheet primitive

**Files:**
- Create: `components/ui/BottomSheet.tsx`

- [ ] **Step 1: Create `components/ui/BottomSheet.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet max height as % of viewport, default 70 */
  heightPercent?: number;
  className?: string;
}

/**
 * Slide-up panel. Dual-theme: glass surface (default) or terminal border.
 * Supports drag-to-dismiss (touch) and backdrop click.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  heightPercent = 70,
  className,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const isTerminal = theme === "terminal";

  // Drag-to-dismiss
  const startY  = useRef<number | null>(null);
  const deltaY  = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    deltaY.current = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const d = e.touches[0].clientY - startY.current;
    deltaY.current = d;
    if (d > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${d}px)`;
    }
  };
  const handleTouchEnd = () => {
    if (deltaY.current > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    startY.current = null;
    deltaY.current = 0;
  };

  // Prevent scroll bleed
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sheetStyle: React.CSSProperties = isTerminal
    ? {
        background: "#000",
        borderTop: "1px solid rgba(0,255,102,0.35)",
        borderLeft: "1px solid rgba(0,255,102,0.20)",
        borderRight: "1px solid rgba(0,255,102,0.20)",
        borderRadius: 0,
        maxHeight: `${heightPercent}vh`,
      }
    : {
        background: "var(--glass-hi)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        backdropFilter: "blur(40px) saturate(180%)",
        borderTop: "0.5px solid var(--glass-edge)",
        borderLeft: "0.5px solid var(--glass-edge)",
        borderRight: "0.5px solid var(--glass-edge)",
        borderRadius: "24px 24px 0 0",
        maxHeight: `${heightPercent}vh`,
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn("fixed bottom-0 left-0 right-0 z-[200] overflow-y-auto", className)}
        style={{
          ...sheetStyle,
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{
              width: 36, height: 4,
              background: isTerminal ? "rgba(0,255,102,0.3)" : "rgba(0,0,0,0.15)",
            }}
          />
        </div>
        {children}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Type-check + build**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
npx next build 2>&1 | tail -20
```

Expected: no TS errors, build succeeds with all routes listed.

- [ ] **Step 3: Commit**

```bash
git add components/ui/BottomSheet.tsx
git commit -m "feat: BottomSheet primitive (glass + terminal, drag-to-dismiss)"
```

---

## Task 4: Portfolio — wallet balance

**Files:**
- Create: `hooks/useTonBalance.ts`
- Modify: `app/(tabs)/portfolio/page.tsx`

- [ ] **Step 1: Create `hooks/useTonBalance.ts`**

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import { useActivity } from "@/hooks/useActivity";

export interface TonBalanceResult {
  tonFormatted:  string | null;   // "12.45 TON"
  usdFormatted:  string | null;   // "≈ $36.20"
  source:        "live" | "approx" | "none";
  isLoading:     boolean;
}

const TON_API_KEY = process.env.NEXT_PUBLIC_TON_API_KEY ?? "";

/** Fetch balance from tonapi.io/v2; falls back to trade-history approximation. */
export function useTonBalance(): TonBalanceResult {
  const address = useTonAddress();  // user-friendly format

  const liveQuery = useQuery({
    queryKey: ["ton-balance", address],
    enabled:  !!address && !!TON_API_KEY,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
        headers: TON_API_KEY ? { Authorization: `Bearer ${TON_API_KEY}` } : {},
      });
      if (!res.ok) throw new Error("tonapi error");
      const json = await res.json();
      return json as { balance: number; balance_usd?: number };
    },
  });

  const { data: activity } = useActivity({ limit: 200 });

  if (!address) {
    return { tonFormatted: null, usdFormatted: null, source: "none", isLoading: false };
  }

  if (liveQuery.isLoading) {
    return { tonFormatted: null, usdFormatted: null, source: "live", isLoading: true };
  }

  if (liveQuery.data) {
    const nanotons = liveQuery.data.balance;
    const ton      = nanotons / 1_000_000_000;
    const usd      = liveQuery.data.balance_usd;
    return {
      tonFormatted: `${ton.toLocaleString("en", { maximumFractionDigits: 2 })} TON`,
      usdFormatted: usd != null ? `≈ $${usd.toLocaleString("en", { maximumFractionDigits: 2 })}` : null,
      source: "live",
      isLoading: false,
    };
  }

  // Fallback: sum accepted USD estimates from copied trades
  const approxUsd = activity
    ?.filter((e) => e.decision?.outcome === "accepted" && e.usdEstimate != null)
    .reduce((sum, e) => sum + (e.usdEstimate ?? 0), 0) ?? 0;

  return {
    tonFormatted: `≈ $${approxUsd.toLocaleString("en", { maximumFractionDigits: 2 })} (copied)`,
    usdFormatted: null,
    source: "approx",
    isLoading: false,
  };
}
```

- [ ] **Step 2: Add wallet balance section to `app/(tabs)/portfolio/page.tsx`**

Add these imports at the top of the file (after existing imports):

```tsx
import { useTonBalance } from "@/hooks/useTonBalance";
import { useWallet, useWalletActions } from "@/hooks/useWallet";
```

In the glass branch of `PortfolioPage`, insert the following block right after the `<PageTitle>` component and before the stats grid. Find this line in the glass branch:

```tsx
  return (
    <div>
      <PageTitle overline="Your positions" title="Portfolio" />
```

Replace it with:

```tsx
  const balance = useTonBalance();
  const { isConnected } = useWallet();
  const { connect } = useWalletActions();

  // ... (keep existing return for terminal branch unchanged)

  return (
    <div>
      <PageTitle overline="Your positions" title="Portfolio" />

      {/* Wallet balance card */}
      <div className="px-4 mb-4">
        {!isConnected ? (
          <Glass hi radius={22} padding={16} className="flex items-center justify-between">
            <div>
              <div className="text-subtle" style={{ fontSize: 12 }}>Wallet balance</div>
              <div className="text-muted mt-1" style={{ fontSize: 13 }}>Connect wallet to see balance</div>
            </div>
            <button
              onClick={connect}
              data-tour="connect-wallet"
              className="rounded-full px-4 py-2 font-semibold transition-colors"
              style={{
                fontSize: 13,
                background: "rgb(var(--text1))",
                color: "rgb(var(--bg))",
                boxShadow: "0 4px 12px -4px rgba(0,0,0,0.25)",
              }}
            >
              Connect
            </button>
          </Glass>
        ) : (
          <Glass hi radius={22} padding={16}>
            <div className="text-subtle uppercase tracking-wider" style={{ fontSize: 10 }}>Wallet balance</div>
            {balance.isLoading ? (
              <GlassSkeleton className="h-8 w-40 mt-2" />
            ) : (
              <>
                <div className="text-fg gl-tnum mt-1" style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  {balance.tonFormatted ?? "—"}
                </div>
                {balance.usdFormatted && (
                  <div className="text-muted mt-0.5" style={{ fontSize: 13 }}>
                    {balance.usdFormatted}
                  </div>
                )}
                {balance.source === "approx" && (
                  <div className="text-faint mt-1" style={{ fontSize: 10 }}>
                    * Approximate from copied trades
                  </div>
                )}
              </>
            )}
          </Glass>
        )}
      </div>
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add hooks/useTonBalance.ts app/\(tabs\)/portfolio/page.tsx
git commit -m "feat: Portfolio wallet balance (live tonapi / approx fallback)"
```

---

## Task 5: Onboarding — WelcomeScreens + SpotlightTour + OnboardingManager

**Files:**
- Create: `components/onboarding/WelcomeScreens.tsx`
- Create: `components/onboarding/SpotlightTour.tsx`
- Create: `components/onboarding/OnboardingManager.tsx`
- Modify: `app/(tabs)/layout.tsx`

- [ ] **Step 1: Create `components/onboarding/WelcomeScreens.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface Slide {
  icon:  string;
  title: string;
  body:  string;
}

const SLIDES: Slide[] = [
  {
    icon:  "◆",
    title: "Copy the best traders\non TON — automatically.",
    body:  "TonMirror зеркалирует сделки топовых кошельков прямо в твой. Никакого трейдинга вручную.",
  },
  {
    icon:  "👁",
    title: "Follow a Leader",
    body:  "Изучи статистику, риск-скор и историю сделок. Один тап — и ты следишь за лидером.",
  },
  {
    icon:  "⚡",
    title: "Auto or Manual",
    body:  "Подтверждай каждую сделку вручную или дай стратегии работать автоматом.",
  },
];

interface WelcomeScreensProps {
  onComplete: () => void;
  onSkip:     () => void;
}

export function WelcomeScreens({ onComplete, onSkip }: WelcomeScreensProps) {
  const { theme } = useTheme();
  const [idx, setIdx] = useState(0);

  // Swipe detection
  let touchStartX = 0;
  const onTouchStart = (e: React.TouchEvent) => { touchStartX = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (delta < -50 && idx < SLIDES.length - 1) setIdx((p) => p + 1);
    if (delta >  50 && idx > 0)                 setIdx((p) => p - 1);
  };

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  if (theme === "terminal") {
    return (
      <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center px-8 tm-mono">
        <button onClick={onSkip} className="absolute top-12 right-6 text-phos-mid text-[10px] tracking-[0.15em]">
          SKIP ✕
        </button>
        <div className="text-phos text-[40px] mb-6">{slide.icon}</div>
        <div className="tm-disp text-phos-hi text-[14px] text-center leading-snug mb-4 tracking-[0.04em] uppercase whitespace-pre-line">
          {slide.title}
        </div>
        <div className="text-phos-mid text-[11px] text-center leading-relaxed mb-10">{slide.body}</div>
        <div className="flex gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <span key={i} className="block h-[2px] w-8"
              style={{ background: i === idx ? "#00ff66" : "rgba(0,255,102,0.2)" }} />
          ))}
        </div>
        <div className="flex gap-3">
          {!isLast && (
            <button onClick={onSkip}
              className="px-4 py-2 border border-phos-border-dim text-phos-mid text-[10px] tracking-[0.15em]">
              SKIP
            </button>
          )}
          <button
            onClick={isLast ? onComplete : () => setIdx((p) => p + 1)}
            className="px-6 py-2 border border-phos bg-phos/10 text-phos-hi text-[10px] tracking-[0.15em] font-bold">
            {isLast ? "START ▸" : "NEXT ▸"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center px-8"
      style={{ background: "rgb(var(--bg))" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button onClick={onSkip}
        className="absolute top-14 right-6 text-subtle"
        style={{ fontSize: 13, fontWeight: 500 }}>
        Skip
      </button>

      <div style={{ fontSize: 64, lineHeight: 1 }} className="mb-8">{slide.icon}</div>

      <h1
        className="text-fg text-center mb-4 whitespace-pre-line"
        style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}
      >
        {slide.title}
      </h1>
      <p className="text-muted text-center mb-10" style={{ fontSize: 15, lineHeight: 1.6 }}>
        {slide.body}
      </p>

      {/* Dot indicators */}
      <div className="flex gap-2 mb-10">
        {SLIDES.map((_, i) => (
          <div key={i} className="rounded-full transition-all"
            style={{
              width: i === idx ? 20 : 6, height: 6,
              background: i === idx ? "rgb(var(--text1))" : "rgb(var(--text4))",
            }}
          />
        ))}
      </div>

      <button
        onClick={isLast ? onComplete : () => setIdx((p) => p + 1)}
        className="w-full max-w-[280px] rounded-full py-4 font-semibold transition-colors"
        style={{
          fontSize: 16,
          background: "rgb(var(--text1))",
          color: "rgb(var(--bg))",
          boxShadow: "0 8px 24px -6px rgba(0,0,0,0.25)",
        }}
      >
        {isLast ? "Get started →" : "Next →"}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `components/onboarding/SpotlightTour.tsx`**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

interface TourStep {
  targetSelector: string;
  title:     string;
  body:      string;
  placement: "top" | "bottom";
}

const STEPS: TourStep[] = [
  {
    targetSelector: '[data-tour="tab-mirror"]',
    title: "Live Feed",
    body: "Все входящие сигналы от лидеров в реальном времени.",
    placement: "top",
  },
  {
    targetSelector: '[data-tour="tab-market"]',
    title: "Market",
    body: "Лидеры и лента сделок в одном месте.",
    placement: "top",
  },
  {
    targetSelector: '[data-tour="tab-portfolio"]',
    title: "Portfolio",
    body: "Баланс кошелька, активные стратегии и PnL.",
    placement: "top",
  },
  {
    targetSelector: '[data-tour="tab-settings"]',
    title: "Settings",
    body: "Тема, стратегия и демо-режим.",
    placement: "top",
  },
  {
    targetSelector: '[data-tour="connect-wallet"]',
    title: "Connect Wallet",
    body: "Подключи TON-кошелёк, чтобы начать копировать сделки.",
    placement: "bottom",
  },
];

interface SpotlightTourProps {
  onComplete: () => void;
}

interface Rect { top: number; left: number; width: number; height: number }

export function SpotlightTour({ onComplete }: SpotlightTourProps) {
  const { theme } = useTheme();
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);

  const measureTarget = useCallback((selector: string) => {
    const el = document.querySelector(selector);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    measureTarget(STEPS[stepIdx].targetSelector);
  }, [stepIdx, measureTarget]);

  const next = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx((p) => p + 1);
    else onComplete();
  };

  const step = STEPS[stepIdx];
  const pad  = 8;
  const vw   = typeof window !== "undefined" ? window.innerWidth  : 390;
  const vh   = typeof window !== "undefined" ? window.innerHeight : 844;

  // Tooltip position
  let tooltipTop: number;
  if (rect) {
    tooltipTop = step.placement === "top"
      ? rect.top - pad - 120
      : rect.top + rect.height + pad + 12;
    tooltipTop = Math.max(12, Math.min(tooltipTop, vh - 140));
  } else {
    tooltipTop = vh / 2 - 60;
  }

  const isTerminal = theme === "terminal";

  return (
    <div className="fixed inset-0 z-[300]" onClick={next}>
      {/* Dark overlay with spotlight cutout */}
      <svg width={vw} height={vh} className="absolute inset-0 pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect width={vw} height={vh} fill="white" />
            {rect && (
              <rect
                x={rect.left - pad} y={rect.top - pad}
                width={rect.width + pad * 2} height={rect.height + pad * 2}
                rx="12" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width={vw} height={vh} fill="rgba(0,0,0,0.72)" mask="url(#spotlight-mask)" />
        {/* Highlight border */}
        {rect && (
          <rect
            x={rect.left - pad} y={rect.top - pad}
            width={rect.width + pad * 2} height={rect.height + pad * 2}
            rx="12" fill="none"
            stroke={isTerminal ? "rgba(0,255,102,0.7)" : "rgba(255,255,255,0.5)"}
            strokeWidth="1.5"
          />
        )}
      </svg>

      {/* Tooltip */}
      <div
        className="absolute left-4 right-4"
        style={{ top: tooltipTop }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="rounded-[18px] p-4"
          style={isTerminal
            ? { background: "#000", border: "1px solid rgba(0,255,102,0.4)" }
            : {
                background: "var(--glass-hi)",
                WebkitBackdropFilter: "blur(30px)",
                backdropFilter: "blur(30px)",
                border: "0.5px solid var(--glass-edge)",
                boxShadow: "0 8px 32px -8px rgba(0,0,0,0.3)",
              }}
        >
          <div
            className={isTerminal ? "tm-disp text-phos-hi text-[13px] tracking-[0.1em] uppercase mb-1" : "text-fg mb-1"}
            style={isTerminal ? {} : { fontSize: 15, fontWeight: 700 }}
          >
            {step.title}
          </div>
          <div
            className={isTerminal ? "text-phos-mid text-[11px]" : "text-muted"}
            style={isTerminal ? {} : { fontSize: 13, lineHeight: 1.5 }}
          >
            {step.body}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className="rounded-full"
                  style={{
                    width: 6, height: 6,
                    background: i === stepIdx
                      ? (isTerminal ? "#00ff66" : "rgb(var(--text1))")
                      : (isTerminal ? "rgba(0,255,102,0.2)" : "rgb(var(--text4))"),
                  }}
                />
              ))}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              className={isTerminal
                ? "px-3 py-1 border border-phos text-phos-hi text-[9px] tracking-[0.15em] font-bold tm-mono"
                : "rounded-full px-4 py-1.5 font-semibold transition-colors"}
              style={isTerminal ? {} : {
                fontSize: 12,
                background: "rgb(var(--text1))",
                color: "rgb(var(--bg))",
              }}
            >
              {stepIdx < STEPS.length - 1
                ? (isTerminal ? "NEXT ▸" : "Next →")
                : (isTerminal ? "DONE ▸" : "Done ✓")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/onboarding/OnboardingManager.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { WelcomeScreens } from "./WelcomeScreens";
import { SpotlightTour }  from "./SpotlightTour";

type Stage = "welcome" | "tour" | "done";

const KEY = "tonmirror-onboarded";

export function OnboardingManager() {
  const [stage, setStage] = useState<Stage>("done"); // start done to avoid SSR flash

  useEffect(() => {
    // Run only on client after hydration
    if (!localStorage.getItem(KEY)) {
      setStage("welcome");
    }
  }, []);

  const handleWelcomeDone = () => setStage("tour");
  const handleSkip        = () => { localStorage.setItem(KEY, "1"); setStage("done"); };
  const handleTourDone    = () => { localStorage.setItem(KEY, "1"); setStage("done"); };

  if (stage === "done")    return null;
  if (stage === "welcome") return <WelcomeScreens onComplete={handleWelcomeDone} onSkip={handleSkip} />;
  return <SpotlightTour onComplete={handleTourDone} />;
}
```

- [ ] **Step 4: Mount OnboardingManager in `app/(tabs)/layout.tsx`**

Add import at the top of the file:

```tsx
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";
```

In the glass branch return statement, add `<OnboardingManager />` as the first child inside the outermost `<div>`:

```tsx
  return (
    <div className="relative min-h-screen text-fg">
      <OnboardingManager />
      <GlassBackdrop />
      <GlassStatusBar />
      <GlassTicker />
      <main className="relative z-10 pt-[77px] pb-[96px]">
        {children}
      </main>
      <GlassTabBar />
    </div>
  );
```

For the terminal branch, also add OnboardingManager (it auto-detects theme internally):

```tsx
  if (theme === "terminal") {
    return (
      <div className="min-h-screen bg-black text-phos-hi tm-mono relative">
        <OnboardingManager />
        <div className="relative h-[47px] z-30">
          <TermStatusBar />
        </div>
        <main className="pb-[80px]">{children}</main>
        <Scanlines opacity={0.22} />
        <Noise opacity={0.06} />
        <SweepLine />
        <Vignette />
        <TermTabBar />
      </div>
    );
  }
```

- [ ] **Step 5: Add "Show tour again" to Settings**

In `app/(tabs)/settings/page.tsx`, find the About section in the glass branch. Add a SettingRow before the closing of the About glass card:

```tsx
<SettingRow
  icon="◎"
  label="Show onboarding again"
  control={
    <GlassButton
      variant="secondary"
      size="sm"
      onClick={() => {
        localStorage.removeItem("tonmirror-onboarded");
        window.location.reload();
      }}
    >
      Show
    </GlassButton>
  }
/>
```

In the terminal branch settings, add a similar row in the appropriate section:

```tsx
<div className="flex items-center justify-between py-2 border-b border-phos-border-dim">
  <span className="text-phos-mid text-[10px] tm-mono tracking-[0.1em]">ONBOARDING TOUR</span>
  <Button variant="secondary" size="sm" onClick={() => {
    localStorage.removeItem("tonmirror-onboarded");
    window.location.reload();
  }}>SHOW</Button>
</div>
```

- [ ] **Step 6: Type-check + build**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
npx next build 2>&1 | tail -25
```

Expected: zero TS errors, successful build with `/market` in the routes list.

- [ ] **Step 7: Commit**

```bash
git add components/onboarding/ app/\(tabs\)/layout.tsx app/\(tabs\)/settings/page.tsx
git commit -m "feat: onboarding — welcome screens + spotlight tour + show-again in settings"
```

---

## Task 6: Final verification

- [ ] **Step 1: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "^npm warn"
```

Expected: no output (zero errors).

- [ ] **Step 2: Production build**

```bash
npx next build 2>&1 | tail -30
```

Expected: build succeeds, routes include `/market`, `/portfolio`, `/home`, `/settings`. No `/leaders` or `/activity` as standalone pages (they redirect).

- [ ] **Step 3: Push**

```bash
git push origin main
```

---

## Spec coverage checklist

| Requirement | Task |
|---|---|
| Dark inactive tab color fix | Task 1 |
| 4 tabs: Mirror/Market/Portfolio/Settings | Task 1 |
| `data-tour` attributes on tabs | Task 1 |
| `/market` with Leaders+Activity sub-tabs | Task 2 |
| Inline activity expand on tap | Task 2 |
| Leader card opens BottomSheet | Task 2 |
| `/leaders` redirect → `/market` | Task 2 |
| `/activity` redirect → `/market?tab=activity` | Task 2 |
| BottomSheet primitive (glass + terminal) | Task 3 |
| `useTonBalance` live/approx/none | Task 4 |
| Portfolio wallet balance hero card | Task 4 |
| `data-tour="connect-wallet"` on connect button | Task 4 |
| WelcomeScreens (3 slides, swipeable) | Task 5 |
| SpotlightTour (5 steps, clip-path highlight) | Task 5 |
| OnboardingManager (localStorage gating) | Task 5 |
| Onboarding mounted in layout | Task 5 |
| "Show tour again" in Settings | Task 5 |
