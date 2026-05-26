"use client";

import { useState } from "react";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { QuoteCard } from "@/components/activity/QuoteCard";
import { formatAmount, formatRelativeTime, formatUsd } from "@/lib/format";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityEvent } from "@/hooks/useActivity";

type Filter = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";

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
  return (
    <span className="tm-mono text-[9px] tracking-[0.15em]" style={{ color: m.c }}>
      EXEC:{m.l}
    </span>
  );
}

function canGetQuote(e: ActivityEvent) {
  return (
    e.execution !== null &&
    (e.execution.status === "pending" || e.execution.status === "quoted") &&
    e.decision !== null &&
    e.decision.outcome !== "rejected"
  );
}

function decTag(outcome: string) {
  return outcome === "accepted"
    ? { c: "#c8ffd8", g: "◆", l: "ACCEPT" }
    : outcome === "review"
    ? { c: "#ffd500", g: "◇", l: "REVIEW" }
    : { c: "#ff3050", g: "✕", l: "REJECT" };
}

function EventRow({ event }: { event: ActivityEvent }) {
  const [showQuote, setShowQuote] = useState(false);
  const d = event.decision ? decTag(event.decision.outcome) : { c: "#4a8a5e", g: "·", l: "NONE" };
  const canQuote = canGetQuote(event);

  return (
    <div>
      <div className="border border-phos-border-dim bg-bg-panel p-2.5">
        <div
          className="grid items-center gap-2"
          style={{ gridTemplateColumns: "52px 14px 1fr 70px" }}
        >
          <span className="text-phos-mid text-[10px] tm-mono">
            {new Date(event.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
          </span>
          <span className="text-[13px] font-bold" style={{ color: d.c }}>
            {d.g}
          </span>
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
            {event.execution && (
              <div className="mt-1">
                <ExecStatusGlyph status={event.execution.status} />
              </div>
            )}
          </div>
        </div>

        {/* risk flags */}
        {event.decision && event.decision.riskFlags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pl-[68px]">
            {event.decision.riskFlags.map((f) => (
              <Badge key={f} variant="warning">
                ⚠ {f.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}

        {/* quote button */}
        {canQuote && (
          <div className="mt-2 pl-[68px]">
            <Button
              variant={showQuote ? "ghost" : "secondary"}
              size="sm"
              onClick={() => setShowQuote((p) => !p)}
            >
              {showQuote ? "▴ HIDE QUOTE" : "▸ GET QUOTE"}
            </Button>
          </div>
        )}
      </div>

      {showQuote && event.execution && event.decision && (
        <QuoteCard
          executionId={event.execution.id}
          soldToken={event.soldToken}
          boughtToken={event.boughtToken}
          plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
          slippageBps={100}
          onDismiss={() => setShowQuote(false)}
        />
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { data: events, isLoading, isError } = useActivity({ limit: 50 });
  const [filter, setFilter] = useState<Filter>("ALL");

  const filterMap: Record<Filter, string | null> = {
    ALL: null,
    ACCEPT: "accepted",
    REVIEW: "review",
    REJECT: "rejected",
  };

  const filtered =
    events?.filter((e) => {
      const want = filterMap[filter];
      if (!want) return true;
      return e.decision?.outcome === want;
    }) ?? [];

  return (
    <div>
      <TermHeader title="TAPE·LOG" sub="copy · activity · live" />

      <div className="px-3 pt-2 space-y-2">
        {/* Filter row */}
        <div className="flex gap-1">
          {(["ALL", "ACCEPT", "REVIEW", "REJECT"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-[9px] tracking-[0.15em] font-bold tm-mono ${
                filter === f
                  ? "border border-phos bg-phos/10 text-phos-hi"
                  : "border border-phos-border-dim text-phos-mid"
              }`}
            >
              ▸ {f}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-[9px] text-phos-mid tm-mono px-1">
          <span>{filtered.length} EVENTS</span>
          <span>
            <span className="tm-blink text-phos">●</span> STREAMING
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="tm-disp text-danger">▲ ERR_DB ▲</p>
            <p className="text-phos-mid text-sm mt-1">check database connection.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="tm-disp text-phos-mid">▢ NO·EVENTS ▢</p>
            <p className="text-phos-mid text-[10px] mt-1 tm-mono">
              follow leaders or emit a demo trade in settings.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        )}

        <div className="text-center text-[9px] text-phos-mid tm-mono pt-2">
          ─── END · OF · TAPE ··· <BlinkCaret /> ───
        </div>
      </div>
    </div>
  );
}
