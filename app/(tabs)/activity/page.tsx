import { Card } from "@/components/ui/Card";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { formatAmount, formatRelativeTime } from "@/lib/format";

/** Placeholder events — replaced with /api/activity in Phase 2 */
const SAMPLE_EVENTS = [
  {
    id:          "1",
    leader:      "Alpha Whale 🐋",
    soldToken:   "TON",
    boughtToken: "USDT",
    soldAmount:  120,
    timestamp:   new Date(Date.now() - 2 * 3_600_000),
    decision:    "accepted"  as const,
    status:      "pending"   as const,
  },
  {
    id:          "2",
    leader:      "DeFi Degen 🎰",
    soldToken:   "TON",
    boughtToken: "DOGS",
    soldAmount:  50,
    timestamp:   new Date(Date.now() - 1 * 3_600_000),
    decision:    "rejected"  as const,
    status:      null,
  },
  {
    id:          "3",
    leader:      "Steady Eddie 📈",
    soldToken:   "USDT",
    boughtToken: "TON",
    soldAmount:  200,
    timestamp:   new Date(Date.now() - 12 * 3_600_000),
    decision:    "manual_review" as const,
    status:      "pending"    as const,
  },
];

export default function ActivityPage() {
  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Activity</h1>
        <Badge variant="muted">{SAMPLE_EVENTS.length} events</Badge>
      </div>

      {SAMPLE_EVENTS.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-4xl mb-3">⚡️</p>
          <p className="text-text-secondary font-medium">No activity yet</p>
          <p className="text-text-muted text-sm mt-1">
            Follow leaders and copy trades to see events here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {SAMPLE_EVENTS.map((event) => (
            <Card key={event.id} elevated>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-text-muted">{event.leader}</p>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">
                    {formatAmount(event.soldAmount)} {event.soldToken}{" "}
                    <span className="text-text-muted font-normal">→</span>{" "}
                    {event.boughtToken}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <DecisionBadge decision={event.decision} />
                  {event.status && (
                    <Badge variant="muted">{event.status}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
