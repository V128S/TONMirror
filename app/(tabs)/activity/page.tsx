"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { QuoteCard } from "@/components/activity/QuoteCard";
import { formatAmount, formatRelativeTime, formatUsd } from "@/lib/format";
import { useActivity } from "@/hooks/useActivity";
import type { ActivityEvent } from "@/hooks/useActivity";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ExecutionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "warning" | "danger" | "muted" | "info"; label: string }> = {
    pending:   { variant: "warning", label: "Pending"   },
    quoted:    { variant: "info",    label: "Quoted"    },
    ready:     { variant: "info",    label: "Ready"     },
    submitted: { variant: "info",    label: "Sent"      },
    confirmed: { variant: "success", label: "Confirmed" },
    failed:    { variant: "danger",  label: "Failed"    },
    skipped:   { variant: "muted",   label: "Skipped"   },
  };
  const { variant, label } = map[status] ?? { variant: "muted" as const, label: status };
  return <Badge variant={variant}>{label}</Badge>;
}

/** Returns true if this event has a pending execution the user can act on */
function canGetQuote(event: ActivityEvent): boolean {
  return (
    event.execution !== null &&
    (event.execution.status === "pending" || event.execution.status === "quoted") &&
    event.decision !== null &&
    event.decision.outcome !== "rejected"
  );
}

// ─── Event row ────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: ActivityEvent }) {
  const [showQuote, setShowQuote] = useState(false);
  const showQuoteButton = canGetQuote(event);

  return (
    <div>
      <Card elevated>
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

            {/* Get Quote button */}
            {showQuoteButton && (
              <div className="mt-2">
                <Button
                  variant={showQuote ? "ghost" : "secondary"}
                  size="sm"
                  onClick={() => setShowQuote((p) => !p)}
                >
                  {showQuote ? "Hide Quote" : "Get Quote →"}
                </Button>
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

      {/* Inline QuoteCard — expands below the event row */}
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { data: events, isLoading, isError } = useActivity({ limit: 50 });

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

  if (isError) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-text-secondary font-medium">Failed to load activity</p>
        <p className="text-text-muted text-sm mt-1">Check database connection.</p>
      </div>
    );
  }

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

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Activity</h1>
        <Badge variant="muted">{events.length} events</Badge>
      </div>
      <div className="space-y-3">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
