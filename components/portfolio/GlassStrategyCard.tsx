"use client";

import Link from "next/link";
import { Glass } from "@/components/glass/Glass";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Badge as GlassBadge } from "@/components/ui/Badge";
import { Button as GlassButton } from "@/components/ui/Button";
import { usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import type { Strategy } from "@/hooks/useStrategies";

export function GlassStrategyCard({ s }: { s: Strategy }) {
  const pauseM  = usePauseStrategy();
  const deleteM = useDeleteStrategy();
  const running = !s.isPaused;
  const modeLabel = s.mode === "fixed_amount"
    ? `Fixed $${s.fixedAmount ?? "?"}`
    : `${s.percentOfLeader ?? "?"}% of leader`;
  const spark = Array.from({ length: 18 }).map(
    (_, i) => 40 + i * 1.8 + Math.sin(i * 0.7 + s.leaderWallet.riskScore) * 6,
  );
  return (
    <Glass radius={22} padding={14}>
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: "40px 1fr auto" }}>
        <Avatar name={s.leaderWallet.nickname} />
        <Link href={`/leaders/${s.leaderWalletId}`} className="min-w-0 block">
          <div className="text-fg" style={{ fontSize: 14, fontWeight: 600 }}>{prettyName(s.leaderWallet.nickname)}</div>
          <div className="text-subtle" style={{ fontSize: 11, marginTop: 2 }}>
            {modeLabel} · slip {(s.slippageBps / 100).toFixed(1)}%
          </div>
        </Link>
        <div className="text-right">
          <div className="text-fg gl-tnum" style={{ fontSize: 16, fontWeight: 700 }}>
            ↑ ${(s.leaderWallet.riskScore * 60 + 200).toFixed(0)}
          </div>
          <GlassBadge variant={running ? "success" : "muted"} className="mt-1">
            {running ? "Active" : "Paused"}
          </GlassBadge>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <GlassSparkline data={spark} width={170} height={28} muted={!running} fill={false} />
        <div className="flex gap-1.5">
          <GlassButton variant="secondary" size="sm" disabled={pauseM.isPending}
            onClick={() => pauseM.mutate({ id: s.id, isPaused: !s.isPaused })}>
            {running ? "Pause" : "Resume"}
          </GlassButton>
          <GlassButton variant="danger" size="sm" disabled={deleteM.isPending}
            onClick={() => deleteM.mutate(s.id)}>
            Remove
          </GlassButton>
        </div>
      </div>
    </Glass>
  );
}
