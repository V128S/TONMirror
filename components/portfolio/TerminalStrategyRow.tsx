"use client";

import Link from "next/link";
import { Sparkline } from "@/components/fx/Sparkline";
import { Button } from "@/components/ui/Button";
import { usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import type { Strategy } from "@/hooks/useStrategies";

export function TermStrategyRow({ strategy, pid }: { strategy: Strategy; pid: string }) {
  const pauseM = usePauseStrategy();
  const deleteM = useDeleteStrategy();
  const modeLabel = strategy.mode === "fixed_amount"
    ? `FIXED $${strategy.fixedAmount ?? "?"}`
    : `${strategy.percentOfLeader ?? "?"}% OF LDR`;
  const spark = Array.from({ length: 18 }).map(
    (_, i) => 40 + i * 1.8 + Math.sin(i * 0.7 + strategy.leaderWallet.riskScore) * 6,
  );
  return (
    <div className="border border-phos-border-dim bg-bg-panel">
      <div className="grid items-center px-2.5 py-2 border-b border-dashed border-phos-border-dim"
        style={{ gridTemplateColumns: "36px 1fr auto" }}>
        <span className="text-phos-mid text-[10px] tm-mono">{pid}</span>
        <Link href={`/leaders/${strategy.leaderWalletId}`}>
          <div className="text-phos-hi text-[11px] font-bold tm-mono">{strategy.leaderWallet.nickname}</div>
          <div className="text-phos-mid text-[9px] tm-mono mt-0.5">
            {modeLabel} · SLIP {(strategy.slippageBps / 100).toFixed(2)}%
          </div>
        </Link>
        <span className="tm-mono text-[9px] tracking-[0.1em] px-1.5 py-0.5 border"
          style={strategy.isPaused ? { borderColor: "#ffd500", color: "#ffd500" } : { borderColor: "#00ff66", color: "#c8ffd8" }}>
          {strategy.isPaused ? "⏸ PSE" : "▶ RUN"}
        </span>
      </div>
      <div className="px-2.5 py-2 flex items-center justify-between gap-2">
        <Sparkline data={spark} width={170} height={22} color={strategy.isPaused ? "#4a8a5e" : "#00ffaa"} fill={false} />
        <div className="flex gap-1.5">
          <Button variant="secondary" size="sm" disabled={pauseM.isPending}
            onClick={() => pauseM.mutate({ id: strategy.id, isPaused: !strategy.isPaused })}>
            {strategy.isPaused ? "RESUME" : "PAUSE"}
          </Button>
          <Button variant="danger" size="sm" disabled={deleteM.isPending}
            onClick={() => deleteM.mutate(strategy.id)}>
            KILL
          </Button>
        </div>
      </div>
    </div>
  );
}
