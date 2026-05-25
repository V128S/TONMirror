"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatUsd, formatPercent } from "@/lib/format";
import { useStrategies, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";

// ─── Strategy row ─────────────────────────────────────────────────────────────

function StrategyRow({ strategy }: { strategy: ReturnType<typeof useStrategies>["data"] extends (infer T)[] | undefined ? T : never }) {
  const pauseMutation  = usePauseStrategy();
  const deleteMutation = useDeleteStrategy();

  const modeLabel =
    strategy.mode === "fixed_amount"
      ? `$${strategy.fixedAmount ?? "?"} / trade`
      : `${strategy.percentOfLeader ?? "?"}% of leader`;

  return (
    <Card>
      <CardHeader className="mb-2 flex flex-row items-center justify-between">
        <Link href={`/leaders/${strategy.leaderWalletId}`} className="flex-1 min-w-0">
          <CardTitle className="truncate">{strategy.leaderWallet.nickname}</CardTitle>
        </Link>
        <Badge variant={strategy.isPaused ? "warning" : "success"}>
          {strategy.isPaused ? "Paused" : "Active"}
        </Badge>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-3 gap-2 text-xs mb-3">
          <div>
            <span className="text-text-muted">Mode</span>
            <p className="text-text-primary font-medium mt-0.5">{modeLabel}</p>
          </div>
          <div>
            <span className="text-text-muted">Risk</span>
            <p className="text-text-primary font-medium mt-0.5">
              {strategy.leaderWallet.riskScore}/10
            </p>
          </div>
          <div>
            <span className="text-text-muted">Slippage</span>
            <p className="text-text-primary font-medium mt-0.5">
              {(strategy.slippageBps / 100).toFixed(2)}%
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            disabled={pauseMutation.isPending}
            onClick={() =>
              pauseMutation.mutate({ id: strategy.id, isPaused: !strategy.isPaused })
            }
          >
            {strategy.isPaused ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(strategy.id)}
          >
            Unfollow
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { data: strategies, isLoading: strategiesLoading } = useStrategies();
  const { data: activity,   isLoading: activityLoading   } = useActivity({ limit: 100 });

  // Compute aggregate stats from real data
  const totalVolume = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;
  const copiedCount = activity?.filter((e) => e.decision?.outcome === "accepted").length ?? 0;
  const rejectedCount = activity?.filter((e) => e.decision?.outcome === "rejected").length ?? 0;

  const activeStrategies  = strategies?.filter((s) => !s.isPaused)  ?? [];
  const pausedStrategies  = strategies?.filter((s) => s.isPaused)   ?? [];

  const isLoading = strategiesLoading || activityLoading;

  return (
    <div className="px-4 pt-6 space-y-4 pb-8">
      <h1 className="text-xl font-bold text-text-primary">Portfolio</h1>

      {/* Summary row */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Card className="py-3 text-center">
            <p className="text-xs text-text-muted">Total volume</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">
              {formatUsd(totalVolume)}
            </p>
          </Card>
          <Card className="py-3 text-center">
            <p className="text-xs text-text-muted">Copied / Rejected</p>
            <p className="text-lg font-bold text-text-primary mt-0.5">
              {copiedCount}
              <span className="text-text-muted font-normal text-sm"> / {rejectedCount}</span>
            </p>
          </Card>
        </div>
      )}

      {/* Active strategies */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-secondary">Active Strategies</h2>
          {!isLoading && (
            <Badge variant="muted">{activeStrategies.length}</Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="w-full h-28 rounded-2xl" />
            <Skeleton className="w-full h-28 rounded-2xl" />
          </div>
        ) : activeStrategies.length > 0 ? (
          <div className="space-y-3">
            {activeStrategies.map((s) => (
              <StrategyRow key={s.id} strategy={s} />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-text-muted text-sm text-center py-4">
              No active strategies.{" "}
              <Link href="/leaders" className="text-ton-400">
                Browse leaders →
              </Link>
            </p>
          </Card>
        )}
      </div>

      {/* Paused strategies */}
      {!isLoading && pausedStrategies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-text-secondary">Paused</h2>
            <Badge variant="warning">{pausedStrategies.length}</Badge>
          </div>
          <div className="space-y-3">
            {pausedStrategies.map((s) => (
              <StrategyRow key={s.id} strategy={s} />
            ))}
          </div>
        </div>
      )}

      {/* Follow CTA if no strategies at all */}
      {!isLoading && (strategies?.length ?? 0) === 0 && (
        <div className="text-center py-8">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-text-secondary font-medium">No strategies yet</p>
          <p className="text-text-muted text-sm mt-1 mb-4">
            Follow a leader wallet to start copy-trading.
          </p>
          <Link
            href="/leaders"
            className="inline-block px-6 py-2.5 rounded-2xl bg-ton-500 text-white text-sm font-semibold"
          >
            Browse Leaders
          </Link>
        </div>
      )}
    </div>
  );
}
