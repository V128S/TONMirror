"use client";

import { useState } from "react";
import { QuoteCard } from "@/components/activity/QuoteCard";
import { DecisionBadge } from "@/components/ui/Badge";
import { formatAmount, formatRelativeTime, formatUsd } from "@/lib/format";
import { prettyName } from "@/components/glass/Avatar";
import type { ActivityEvent } from "@/hooks/useActivity";

export type GlassFilter = "All" | "Accepted" | "Review" | "Rejected";

export const GLASS_FILTER_MAP: Record<GlassFilter, string | null> = {
  All: null, Accepted: "accepted", Review: "manual_review", Rejected: "rejected",
};

function decoFor(outcome: string | undefined) {
  switch (outcome) {
    case "accepted":      return { dot: "rgb(var(--text1))", label: "Accepted", w: 600 };
    case "manual_review": return { dot: "rgb(var(--text2))", label: "Review",   w: 500 };
    case "rejected":      return { dot: "rgb(var(--text3))", label: "Rejected", w: 500 };
    default:              return { dot: "rgb(var(--text4))", label: "Pending",  w: 500 };
  }
}

export function GlassEventRow({ event, last }: { event: ActivityEvent; last: boolean }) {
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
