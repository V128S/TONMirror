"use client";

import { useState } from "react";
import Link from "next/link";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, DecisionBadge, RiskBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { Sparkline }  from "@/components/fx/Sparkline";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { QuoteCard }  from "@/components/activity/QuoteCard";

import { formatPercent, formatUsd, formatAmount, formatRelativeTime } from "@/lib/format";
import type { ActivityEvent } from "@/hooks/useActivity";
import type { MarketViewProps } from "./GlassMarket";

// ── Types ─────────────────────────────────────────────────────────────────
type TermFilter  = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";
const TERM_FILTER_MAP: Record<TermFilter, string | null> = {
  ALL: null, ACCEPT: "accepted", REVIEW: "manual_review", REJECT: "rejected",
};

// ── Helpers ───────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────
export function TerminalMarket({
  leaders, events,
  lLoad, lError,
  eLoad, eError,
  activeTab, setActiveTab,
}: MarketViewProps) {
  const [termFilter, setTermFilter] = useState<TermFilter>("ALL");

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
