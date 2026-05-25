"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  formatUsd,
  formatPercent,
  formatAmount,
  formatRelativeTime,
  shortenAddress,
} from "@/lib/format";
import { useLeader, useFollowLeader } from "@/hooks/useLeaders";
import { useStrategies, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";

// ─── Strategy form state ──────────────────────────────────────────────────────

interface FormValues {
  mode:                 "fixed_amount" | "percent_of_leader";
  fixedAmount:          number;
  percentOfLeader:      number;
  maxTradeSize:         number | "";
  slippageBps:          number;
  requireManualConfirm: boolean;
  copySells:            boolean;
}

const DEFAULT_FORM: FormValues = {
  mode:                 "fixed_amount",
  fixedAmount:          10,
  percentOfLeader:      10,
  maxTradeSize:         "",
  slippageBps:          100,
  requireManualConfirm: true,
  copySells:            false,
};

// ─── StrategyForm ─────────────────────────────────────────────────────────────

function StrategyForm({
  leaderId,
  onSuccess,
}: {
  leaderId: string;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const follow = useFollowLeader();

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    setError(null);
    try {
      await follow.mutateAsync({
        leaderWalletId:       leaderId,
        mode:                 form.mode,
        fixedAmount:          form.mode === "fixed_amount" ? form.fixedAmount : undefined,
        requireManualConfirm: form.requireManualConfirm,
      });
      onSuccess();
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode */}
      <div className="grid grid-cols-2 gap-2">
        {(["fixed_amount", "percent_of_leader"] as const).map((m) => (
          <button
            key={m}
            onClick={() => set("mode", m)}
            className={`rounded-xl py-2.5 text-sm font-medium transition-colors ${
              form.mode === m
                ? "bg-ton-500 text-white"
                : "bg-surface-card text-text-secondary border border-surface-border"
            }`}
          >
            {m === "fixed_amount" ? "Fixed amount" : "% of leader"}
          </button>
        ))}
      </div>

      {/* Amount */}
      {form.mode === "fixed_amount" ? (
        <div>
          <label className="text-xs text-text-muted block mb-1">Amount per trade (USDT)</label>
          <input
            type="number"
            min={1}
            value={form.fixedAmount}
            onChange={(e) => set("fixedAmount", Number(e.target.value))}
            className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2
                       text-sm text-text-primary focus:outline-none focus:border-ton-400"
          />
        </div>
      ) : (
        <div>
          <label className="text-xs text-text-muted block mb-1">% of leader trade</label>
          <input
            type="number"
            min={1}
            max={100}
            value={form.percentOfLeader}
            onChange={(e) => set("percentOfLeader", Number(e.target.value))}
            className="w-full bg-surface-card border border-surface-border rounded-xl px-3 py-2
                       text-sm text-text-primary focus:outline-none focus:border-ton-400"
          />
        </div>
      )}

      {/* Slippage */}
      <div>
        <label className="text-xs text-text-muted block mb-1">Slippage tolerance</label>
        <div className="grid grid-cols-4 gap-1.5">
          {[50, 100, 200, 300].map((bps) => (
            <button
              key={bps}
              onClick={() => set("slippageBps", bps)}
              className={`rounded-lg py-1.5 text-xs font-medium transition-colors ${
                form.slippageBps === bps
                  ? "bg-ton-500 text-white"
                  : "bg-surface-card text-text-secondary border border-surface-border"
              }`}
            >
              {bps / 100}%
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <Toggle
          label="Require manual confirmation"
          description="Review each quote before signing"
          checked={form.requireManualConfirm}
          onChange={(v) => set("requireManualConfirm", v)}
        />
        <Toggle
          label="Copy sell trades"
          description="Mirror sell orders from the leader"
          checked={form.copySells}
          onChange={(v) => set("copySells", v)}
        />
      </div>

      {error && (
        <p className="text-xs text-danger bg-danger/10 rounded-xl px-3 py-2">{error}</p>
      )}

      <Button
        variant="primary"
        fullWidth
        onClick={handleSubmit}
        disabled={follow.isPending}
      >
        {follow.isPending ? "Creating…" : "Start Copy-Trading"}
      </Button>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label:       string;
  description: string;
  checked:     boolean;
  onChange:    (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-text-primary">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? "bg-ton-500" : "bg-surface-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ─── ActiveStrategyCard ───────────────────────────────────────────────────────

function ActiveStrategyCard({ leaderId }: { leaderId: string }) {
  const { data: strategies } = useStrategies();
  const pauseMutation  = usePauseStrategy();
  const deleteMutation = useDeleteStrategy();

  const strategy = strategies?.find((s) => s.leaderWalletId === leaderId);
  if (!strategy) return null;

  const modeLabel =
    strategy.mode === "fixed_amount"
      ? `$${strategy.fixedAmount ?? "?"} per trade`
      : `${strategy.percentOfLeader ?? "?"}% of leader`;

  return (
    <Card elevated className="border border-ton-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Your Strategy</CardTitle>
          <Badge variant={strategy.isPaused ? "warning" : "success"}>
            {strategy.isPaused ? "Paused" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-text-muted">Mode</span>
            <p className="text-text-primary font-medium mt-0.5">{modeLabel}</p>
          </div>
          <div>
            <span className="text-text-muted">Slippage</span>
            <p className="text-text-primary font-medium mt-0.5">
              {(strategy.slippageBps / 100).toFixed(2)}%
            </p>
          </div>
          <div>
            <span className="text-text-muted">Manual confirm</span>
            <p className="text-text-primary font-medium mt-0.5">
              {strategy.requireManualConfirm ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <span className="text-text-muted">Copy sells</span>
            <p className="text-text-primary font-medium mt-0.5">
              {strategy.copySells ? "Yes" : "No"}
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
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

export default function LeaderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: leader, isLoading, isError } = useLeader(id);
  const { data: strategies } = useStrategies();
  const { data: activity, isLoading: activityLoading } = useActivity({
    leaderId: id,
    limit: 10,
  });

  const isFollowing = strategies?.some((s) => s.leaderWalletId === id) ?? false;
  // editOpen: only true when user explicitly opens the edit form
  const [editOpen, setEditOpen] = useState(false);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 pt-4 space-y-4">
        <Skeleton className="w-8 h-8 rounded-xl" />
        <Skeleton className="w-48 h-7" />
        <Skeleton className="w-full h-24 rounded-2xl" />
        <Skeleton className="w-full h-40 rounded-2xl" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError || !leader) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-text-secondary font-medium">Leader not found</p>
        <Link href="/leaders" className="mt-4 inline-block text-ton-400 text-sm">
          ← Back to leaders
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 space-y-4 pb-8">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-text-muted active:text-text-secondary"
      >
        <span>←</span> Leaders
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-text-primary">{leader.nickname}</h1>
          <p className="text-xs text-text-muted mt-0.5 font-mono">
            {shortenAddress(leader.address)}
          </p>
        </div>
        <RiskBadge score={leader.riskScore} />
      </div>

      {/* Tags */}
      {leader.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {leader.tags.map((t) => (
            <Badge key={t} variant="muted">{t}</Badge>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center py-3">
          <p className="text-lg font-bold text-text-primary">
            {formatPercent(leader.winRateApprox)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Win rate</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-lg font-bold text-text-primary">
            {formatPercent(leader.activityScore)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">Activity</p>
        </Card>
        <Card className="text-center py-3">
          <p className="text-lg font-bold text-text-primary">{leader.riskScore}/10</p>
          <p className="text-xs text-text-muted mt-0.5">Risk</p>
        </Card>
      </div>

      {leader.notes && (
        <p className="text-sm text-text-muted bg-surface-card rounded-2xl px-4 py-3 border border-surface-border">
          {leader.notes}
        </p>
      )}

      {/* Strategy section */}
      {isFollowing ? (
        <>
          <ActiveStrategyCard leaderId={id} />
          {!editOpen && (
            <button
              onClick={() => setEditOpen(true)}
              className="text-xs text-ton-400 underline"
            >
              Edit strategy parameters
            </button>
          )}
          {editOpen && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Strategy</CardTitle>
              </CardHeader>
              <CardBody>
                <StrategyForm leaderId={id} onSuccess={() => setEditOpen(false)} />
              </CardBody>
            </Card>
          )}
        </>
      ) : (
        <Card elevated>
          <CardHeader>
            <CardTitle>Set Up Copy Strategy</CardTitle>
            <p className="text-xs text-text-muted mt-1">
              Configure how to mirror {leader.nickname}&apos;s trades.
            </p>
          </CardHeader>
          <CardBody>
            <StrategyForm leaderId={id} onSuccess={() => {}} />
          </CardBody>
        </Card>
      )}

      {/* Recent trades */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-2">
          Recent Trades
        </h2>

        {activityLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="w-full h-14 rounded-2xl" />
            ))}
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-2">
            {activity.map((event) => (
              <Card key={event.id}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">
                      {formatAmount(event.soldAmountDecimal)}{" "}
                      <span className="text-text-secondary">{event.soldToken}</span>{" "}
                      <span className="text-text-muted font-normal">→</span>{" "}
                      <span className="text-text-secondary">{event.boughtToken}</span>
                    </p>
                    {event.usdEstimate != null && (
                      <p className="text-xs text-text-muted mt-0.5">
                        ≈ {formatUsd(event.usdEstimate)} · {formatRelativeTime(event.timestamp)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {event.decision && (
                      <DecisionBadge decision={event.decision.outcome} />
                    )}
                    {!event.decision && (
                      <Badge variant="muted">No decision</Badge>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-text-muted text-sm text-center py-4">
              No trades recorded yet.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
