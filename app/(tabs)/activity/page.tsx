"use client";

import { Card } from "@/components/ui/Card";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount, formatRelativeTime, formatUsd } from "@/lib/format";
import { useActivity } from "@/hooks/useActivity";

function ExecutionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "danger" | "muted" | "info"; label: string }> = {
    pending:   { variant: "warning", label: "Pending" },
    quoted:    { variant: "info",    label: "Quoted"  },
    ready:     { variant: "info",    label: "Ready"   },
    submitted: { variant: "info",    label: "Sent"    },
    confirmed: { variant: "success", label: "Confirmed" },
    failed:    { variant: "danger",  label: "Failed"  },
    skipped:   { variant: "muted",   label: "Skipped" },
  };
  const { variant, label } = map[status] ?? { variant: "muted" as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

export default function ActivityPage() {
  const { data: events, isLoading, isError } = useActivity({ limit: 50 });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Activity</h1>
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} elevated>
            <Skeleton className="w-24 h-3 mb-2" />
            <Skeleton className="w-full h-5" />
            <Skeleton className="w-20 h-3 mt-2" />
          </Card>
        ))}
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-text-secondary font-medium">Failed to load activity</p>
        <p className="text-text-muted text-sm mt-1">Check database connection.</p>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (!events || events.length === 0) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Activity</h1>
          <Badge variant="muted">0 events</Badge>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">⚡️</p>
          <p className="text-text-secondary font-medium">No activity yet</p>
          <p className="text-text-muted text-sm mt-1">
            Follow leaders or use the demo panel to emit trades.
          </p>
        </div>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Activity</h1>
        <Badge variant="muted">{events.length} events</Badge>
      </div>

      <div className="space-y-3">
        {events.map((event) => (
          <Card key={event.id} elevated>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {/* Leader name */}
                <p className="text-xs text-text-muted">{event.leader.nickname}</p>

                {/* Trade direction */}
                <p className="text-sm font-semibold text-text-primary mt-0.5">
                  {formatAmount(event.soldAmountDecimal)}{" "}
                  <span className="text-text-secondary">{event.soldToken}</span>{" "}
                  <span className="text-text-muted font-normal">→</span>{" "}
                  <span className="text-text-secondary">{event.boughtToken}</span>
                </p>

                {/* USD estimate */}
                {event.usdEstimate != null && (
                  <p className="text-xs text-text-muted mt-0.5">
                    ≈ {formatUsd(event.usdEstimate)}
                  </p>
                )}

                {/* Timestamp + source */}
                <p className="text-xs text-text-muted mt-1">
                  {formatRelativeTime(event.timestamp)}{" "}
                  {event.sourceProvider === "mock" && (
                    <span className="text-ton-400/60">• demo</span>
                  )}
                </p>

                {/* Risk flags */}
                {event.decision && event.decision.riskFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {event.decision.riskFlags.map((flag) => (
                      <Badge key={flag} variant="warning" className="text-[10px] px-1.5 py-0">
                        {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Right column: decision + execution status */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {event.decision ? (
                  <DecisionBadge decision={event.decision.outcome} />
                ) : (
                  <Badge variant="muted">No decision</Badge>
                )}
                {event.execution && (
                  <ExecutionStatusBadge status={event.execution.status} />
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
