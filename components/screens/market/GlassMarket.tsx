"use client";

import { useState } from "react";
import Link from "next/link";

import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Badge as GlassBadge, RiskBadge } from "@/components/ui/Badge";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { DecisionBadge } from "@/components/ui/Badge";
import { QuoteCard } from "@/components/activity/QuoteCard";

import { formatPercent, formatUsd, formatAmount, formatRelativeTime } from "@/lib/format";
import type { Leader } from "@/hooks/useLeaders";
import type { ActivityEvent } from "@/hooks/useActivity";

// ── Types ─────────────────────────────────────────────────────────────────
type GlassFilter = "All" | "Accepted" | "Review" | "Rejected";
const GLASS_FILTER_MAP: Record<GlassFilter, string | null> = {
  All: null, Accepted: "accepted", Review: "manual_review", Rejected: "rejected",
};

export interface MarketViewProps {
  leaders: Leader[] | undefined;
  events: ActivityEvent[] | undefined;
  lLoad: boolean; lError: boolean;
  eLoad: boolean; eError: boolean;
  activeTab: "leaders" | "activity";
  setActiveTab: (t: "leaders" | "activity") => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────
function decoFor(outcome: string | undefined) {
  switch (outcome) {
    case "accepted":      return { dot: "rgb(var(--text1))", label: "Accepted", w: 600 };
    case "manual_review": return { dot: "rgb(var(--text2))", label: "Review",   w: 500 };
    case "rejected":      return { dot: "rgb(var(--text3))", label: "Rejected", w: 500 };
    default:              return { dot: "rgb(var(--text4))", label: "Pending",  w: 500 };
  }
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
      <button onClick={() => setExpanded((p) => !p)} className="w-full text-left">
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

      <div className="mb-5">
        <GlassSparkline data={spark} width={320} height={52} />
      </div>

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
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function GlassMarket({
  leaders, events,
  lLoad, lError,
  eLoad, eError,
  activeTab, setActiveTab,
}: MarketViewProps) {
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [glassFilter, setGlassFilter] = useState<GlassFilter>("All");

  const filteredEvents = events?.filter((e) => {
    const want = GLASS_FILTER_MAP[glassFilter];
    if (!want) return true;
    return e.decision?.outcome === want;
  }) ?? [];

  return (
    <div>
      <PageTitle overline="Leaders & Activity" title="Market" />

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

      <BottomSheet isOpen={selectedLeader !== null} onClose={() => setSelectedLeader(null)} heightPercent={88}>
        {selectedLeader && (
          <LeaderSheetContent leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
        )}
      </BottomSheet>
    </div>
  );
}
