"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass imports ───────────────────────────────────────────────────────
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";

// ── Shared / Terminal imports ───────────────────────────────────────────
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { QuoteCard } from "@/components/activity/QuoteCard";
import { formatAmount, formatRelativeTime, formatUsd } from "@/lib/format";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityEvent } from "@/hooks/useActivity";

/* ── Terminal helpers ────────────────────────────────────────────────── */
type TermFilter = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";

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
    : outcome === "review"
    ? { c: "#ffd500", g: "◇", l: "REVIEW" }
    : { c: "#ff3050", g: "✕", l: "REJECT" };
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

/* ── Glass helpers ───────────────────────────────────────────────────── */
type GlassFilter = "All" | "Accepted" | "Review" | "Rejected";
const GLASS_FILTER_MAP: Record<GlassFilter, string | null> = {
  All: null, Accepted: "accepted", Review: "review", Rejected: "rejected",
};

function decoFor(outcome: string | undefined) {
  switch (outcome) {
    case "accepted": return { dot: "rgb(var(--text1))", label: "Accepted", w: 600 };
    case "review":   return { dot: "rgb(var(--text2))", label: "Review",   w: 500 };
    case "rejected": return { dot: "rgb(var(--text3))", label: "Rejected", w: 500 };
    default:         return { dot: "rgb(var(--text4))", label: "Pending",  w: 500 };
  }
}

function GlassEventRow({ event, last }: { event: ActivityEvent; last: boolean }) {
  const [showQuote, setShowQuote] = useState(false);
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
      <div
        className="grid items-center gap-3 px-3.5 py-3.5"
        style={{
          gridTemplateColumns: "48px 1fr auto",
          borderBottom: last && !showQuote ? "none" : "0.5px solid rgb(var(--hair) / 0.08)",
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
          {event.decision && event.decision.riskFlags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {event.decision.riskFlags.map((f) => (
                <span key={f} className="rounded-full px-2 py-0.5 text-muted"
                  style={{ fontSize: 10, background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
                  ⚠ {f.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
          {canQuote && (
            <button onClick={() => setShowQuote((p) => !p)}
              className="mt-2 text-muted underline-offset-2 hover:underline" style={{ fontSize: 11 }}>
              {showQuote ? "Hide quote" : "Get quote →"}
            </button>
          )}
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
        </div>
      </div>
      {showQuote && event.execution && event.decision && (
        <div className="px-3.5 py-2" style={{ borderBottom: "0.5px solid rgb(var(--hair) / 0.08)" }}>
          <QuoteCard
            executionId={event.execution.id} soldToken={event.soldToken} boughtToken={event.boughtToken}
            plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
            slippageBps={100} onDismiss={() => setShowQuote(false)}
          />
        </div>
      )}
    </>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function ActivityPage() {
  const { theme } = useTheme();
  const { data: events, isLoading, isError } = useActivity({ limit: 50 });
  const [termFilter, setTermFilter] = useState<TermFilter>("ALL");
  const [glassFilter, setGlassFilter] = useState<GlassFilter>("All");

  /* ── Terminal UI ───────────────────────────────────────────────────── */
  if (theme === "terminal") {
    const termFilterMap: Record<TermFilter, string | null> = {
      ALL: null, ACCEPT: "accepted", REVIEW: "review", REJECT: "rejected",
    };
    const filtered = events?.filter((e) => {
      const want = termFilterMap[termFilter];
      if (!want) return true;
      return e.decision?.outcome === want;
    }) ?? [];

    return (
      <div>
        <TermHeader title="TAPE·LOG" sub="copy · activity · live" />
        <div className="px-3 pt-2 space-y-2">
          <div className="flex gap-1">
            {(["ALL", "ACCEPT", "REVIEW", "REJECT"] as const).map((f) => (
              <button key={f} onClick={() => setTermFilter(f)}
                className={`flex-1 py-1.5 text-[9px] tracking-[0.15em] font-bold tm-mono ${
                  termFilter === f ? "border border-phos bg-phos/10 text-phos-hi" : "border border-phos-border-dim text-phos-mid"
                }`}>
                ▸ {f}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-phos-mid tm-mono px-1">
            <span>{filtered.length} EVENTS</span>
            <span><span className="tm-blink text-phos">●</span> STREAMING</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="tm-disp text-danger">▲ ERR_DB ▲</p>
              <p className="text-phos-mid text-sm mt-1">check database connection.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="tm-disp text-phos-mid">▢ NO·EVENTS ▢</p>
              <p className="text-phos-mid text-[10px] mt-1 tm-mono">follow leaders or emit a demo trade in settings.</p>
            </div>
          ) : (
            <div className="space-y-2">{filtered.map((e) => <TermEventRow key={e.id} event={e} />)}</div>
          )}
          <div className="text-center text-[9px] text-phos-mid tm-mono pt-2">
            ─── END · OF · TAPE ··· <BlinkCaret /> ───
          </div>
        </div>
      </div>
    );
  }

  /* ── Glass UI ──────────────────────────────────────────────────────── */
  const filtered = events?.filter((e) => {
    const want = GLASS_FILTER_MAP[glassFilter];
    if (!want) return true;
    return e.decision?.outcome === want;
  }) ?? [];

  return (
    <div>
      <PageTitle
        overline="Last 24 hours"
        title="Activity"
        right={
          <span className="text-muted" style={{ fontSize: 12, animation: "gl-pulse 3s ease-in-out infinite" }}>
            ● Live
          </span>
        }
      />
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
          <SectionLabel right={`${filtered.length} events`}>Today</SectionLabel>
          <Glass radius={22} padding={0} className="overflow-hidden">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[1,2,3,4].map((i) => <GlassSkeleton key={i} className="h-14" />)}
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-subtle">Couldn&apos;t load activity.</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-subtle" style={{ fontSize: 12 }}>No events match this filter.</div>
            ) : (
              filtered.map((e, i) => <GlassEventRow key={e.id} event={e} last={i === filtered.length - 1} />)
            )}
          </Glass>
        </div>

        <div className="text-center text-subtle pt-1 pb-1" style={{ fontSize: 11 }}>End of feed</div>
      </div>
    </div>
  );
}
