"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatUsd, formatRelativeTime, formatAmount } from "@/lib/format";
import { useStrategies } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { DecisionBadge } from "@/components/ui/Badge";
import Link from "next/link";

export default function HomePage() {
  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const { data: activity,   isLoading: activityLoading   } = useActivity({ limit: 3 });

  const activeCount  = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday  = activity?.filter(
    (e) =>
      e.decision?.outcome === "accepted" &&
      new Date(e.timestamp).toDateString() === new Date().toDateString(),
  ).length ?? 0;
  const totalVolume  = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">TonMirror</h1>
          <p className="text-xs text-text-muted mt-0.5">Copy the best wallets on TON</p>
        </div>
        <Badge variant="info">Demo</Badge>
      </div>

      {/* Wallet status — Phase 3 will wire TON Connect */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text-muted">Not connected</p>
          <Link
            href="/settings"
            className="mt-3 inline-flex items-center gap-1.5 text-ton-400 text-sm font-medium"
          >
            Connect wallet →
          </Link>
        </CardBody>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          {strategiesLoading ? (
            <Skeleton className="w-8 h-6 mx-auto mb-1" />
          ) : (
            <p className="text-xl font-bold text-text-primary">{activeCount}</p>
          )}
          <p className="text-xs text-text-muted mt-0.5">Following</p>
        </Card>
        <Card className="text-center py-3">
          {activityLoading ? (
            <Skeleton className="w-8 h-6 mx-auto mb-1" />
          ) : (
            <p className="text-xl font-bold text-text-primary">{copiedToday}</p>
          )}
          <p className="text-xs text-text-muted mt-0.5">Copied today</p>
        </Card>
        <Card className="text-center py-3">
          {activityLoading ? (
            <Skeleton className="w-16 h-6 mx-auto mb-1" />
          ) : (
            <p className="text-xl font-bold text-text-primary">{formatUsd(totalVolume)}</p>
          )}
          <p className="text-xs text-text-muted mt-0.5">Volume</p>
        </Card>
      </div>

      {/* CTA */}
      <Link
        href="/leaders"
        className="block w-full py-3.5 rounded-2xl bg-ton-500 text-white text-sm font-semibold text-center
                   hover:bg-ton-600 active:scale-[0.98] transition-all"
      >
        Browse Leader Wallets
      </Link>

      {/* Recent activity preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardBody>
          {activityLoading ? (
            <div className="space-y-2">
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-full h-8" />
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-2">
              {activity.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-muted truncate">{event.leader.nickname}</p>
                    <p className="text-sm text-text-primary font-medium">
                      {formatAmount(event.soldAmountDecimal)} {event.soldToken}{" "}
                      <span className="text-text-muted">→</span>{" "}
                      {event.boughtToken}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {event.decision && <DecisionBadge decision={event.decision.outcome} />}
                    <span className="text-xs text-text-muted">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              <Link href="/activity" className="mt-2 inline-flex text-ton-400 text-xs font-medium">
                View all activity →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-text-muted text-sm">No recent copy activity.</p>
              <Link href="/activity" className="mt-2 inline-flex text-ton-400 text-xs font-medium">
                View all activity →
              </Link>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
