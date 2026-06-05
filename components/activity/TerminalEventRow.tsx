"use client";

import { Button } from "@/components/ui/Button";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { formatAmount, formatUsd, formatRelativeTime } from "@/lib/format";
import type { ActivityEvent } from "@/hooks/useActivity";

export type TermFilter = "ALL" | "ACCEPT" | "REVIEW" | "REJECT";

export const TERM_FILTER_MAP: Record<TermFilter, string | null> = {
  ALL: null, ACCEPT: "accepted", REVIEW: "manual_review", REJECT: "rejected",
};

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

export function TermEventRow({
  event,
  onConfirm,
}: {
  event: ActivityEvent;
  onConfirm?: (event: ActivityEvent) => void;
}) {
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
        {canQuote && onConfirm && (
          <div className="mt-2 pl-[68px]">
            <Button variant="secondary" size="sm" onClick={() => onConfirm(event)}>
              ▸ CONFIRM · COPY
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
