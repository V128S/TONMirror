"use client";

import { useState, useEffect, Suspense } from "react";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";

// ── Types ─────────────────────────────────────────────────────────────────
type MarketTab   = "leaders" | "activity";
type TermFilter  = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";
type GlassFilter = "All" | "Accepted" | "Review" | "Rejected";
const GLASS_FILTER_MAP: Record<GlassFilter, string | null> = {
  All: null, Accepted: "accepted", Review: "manual_review", Rejected: "rejected",
};
const TERM_FILTER_MAP: Record<TermFilter, string | null> = {
  ALL: null, ACCEPT: "accepted", REVIEW: "manual_review", REJECT: "rejected",
};

// ── Activity helpers ──────────────────────────────────────────────────────
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
    case "accepted":      return { dot: "rgb(var(--text1))", label: "Accepted", w: 600 };
    case "manual_review": return { dot: "rgb(var(--text2))", label: "Review",   w: 500 };
    case "rejected":      return { dot: "rgb(var(--text3))", label: "Rejected", w: 500 };
    default:              return { dot: "rgb(var(--text4))", label: "Pending",  w: 500 };
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

// ── Page ──────────────────────────────────────────────────────────────────
function MarketPageInner() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<MarketTab>("leaders");
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

  const { data: leaders, isLoading: lLoad, isError: lError } = useLeaders(userId ?? undefined);
  const { data: events,  isLoading: eLoad, isError: eError  } = useActivity({ limit: 50 });
  const [termFilter,  setTermFilter]  = useState<TermFilter>("ALL");
  const [glassFilter, setGlassFilter] = useState<GlassFilter>("All");

  // Sync tab from URL param — reacts to both set and clear
  useEffect(() => {
    setActiveTab(searchParams?.get("tab") === "activity" ? "activity" : "leaders");
  }, [searchParams]);

  /* ── Terminal ──────────────────────────────────────────────────────── */
  if (theme === "terminal") {
    const filteredEvents = events?.filter((e) => {
      const want = TERM_FILTER_MAP[termFilter];
      if (!want) return true;
      return e.decision?.outcome === want;
    }) ?? [];

    return (
      <div>
        <TermHeader title="MARKET" sub="leaders · tape · signals" />
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

export default function MarketPage() {
  return (
    <Suspense fallback={null}>
      <MarketPageInner />
    </Suspense>
  );
}
