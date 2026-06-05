"use client";

import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TermHeader } from "@/components/terminal/TermHeader";
import { MirrorBar }   from "@/components/terminal/MirrorBar";
import { CornerBox }   from "@/components/terminal/CornerBox";
import { Sparkline }   from "@/components/fx/Sparkline";
import { RiskMeter }   from "@/components/fx/RiskMeter";

import { formatUsd } from "@/lib/format";
import { type Strategy, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { type PortfolioViewProps } from "./GlassPortfolio";

/* ── Terminal strategy row ─────────────────────────────────────────────── */
function TermStrategyRow({ strategy, pid }: { strategy: Strategy; pid: string }) {
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

/* ── Terminal Portfolio screen ─────────────────────────────────────────── */
export function TerminalPortfolio({
  strategies,
  active,
  paused,
  isLoading,
  totalVolume,
  copiedCount,
  rejectedCount,
  reviewCount,
  aggSpark,
}: PortfolioViewProps) {
  return (
    <div>
      <TermHeader title="PORTFOLIO" sub="strategies · sessions" />
      <div className="px-4 pt-2 space-y-3.5">
        <CornerBox className="border border-phos-border bg-bg-panel p-3.5">
          <div className="flex justify-between">
            <div>
              <div className="text-[9px] text-phos-mid tracking-[0.18em]">TOTAL · VOL</div>
              {isLoading ? <Skeleton className="h-8 w-32 mt-1" /> : (
                <div className="tm-disp tm-glow text-[28px] text-phos-hi mt-0.5">{formatUsd(totalVolume)}</div>
              )}
              <div className="text-[10px] text-phos-soft mt-0.5">copy · activity · gross</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] text-phos-mid tracking-[0.18em]">SESSIONS</div>
              <div className="tm-disp text-[18px] text-phos-hi mt-0.5">{strategies?.length ?? 0}</div>
              <div className="text-[10px] text-phos-mid mt-0.5">{active.length} run · {paused.length} pause</div>
            </div>
          </div>
          <div className="mt-2.5">
            <Sparkline data={aggSpark} width={310} height={36} color="#00ffaa" fill />
          </div>
          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            {[
              { l: "COPIED", v: copiedCount, c: "phos-hi" },
              { l: "REVIEW", v: reviewCount, c: "warn" },
              { l: "REJECT", v: rejectedCount, c: "danger" },
            ].map((k) => (
              <div key={k.l} className="border-l-2 border-phos-border-dim pl-1.5">
                <div className="text-[8px] text-phos-mid tracking-[0.15em]">{k.l}</div>
                <div className={`tm-disp text-[14px] text-${k.c} mt-0.5`}>{String(k.v).padStart(2, "0")}</div>
              </div>
            ))}
          </div>
        </CornerBox>

        <div>
          <MirrorBar label="ACTIVE · PROCESSES" />
          <div className="mt-1.5">
            <div className="grid items-center px-2.5 py-1.5 border border-phos-border-dim border-b-0 bg-bg-el text-[8px] text-phos-mid tracking-[0.15em]"
              style={{ gridTemplateColumns: "36px 1fr auto" }}>
              <span>PID</span><span>LEADER · MODE</span><span>STAT</span>
            </div>
            {isLoading ? (
              <div className="border border-phos-border-dim border-t-0 p-2 space-y-2">
                {[1,2].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : active.length > 0 ? (
              <div className="space-y-0">
                {active.map((s, i) => <TermStrategyRow key={s.id} strategy={s} pid={`0x${(i+1).toString().padStart(2,"0")}`} />)}
              </div>
            ) : (
              <Card className="border-t-0">
                <p className="text-phos-mid text-[10px] text-center py-3 tm-mono">
                  ▢ NO · ACTIVE · PROCESSES ▢<br />
                  <Link href="/leaders" className="text-phos-soft mt-1 inline-block">browse leaders →</Link>
                </p>
              </Card>
            )}
          </div>
        </div>

        {!isLoading && paused.length > 0 && (
          <div>
            <MirrorBar label="PAUSED · PROCESSES" />
            <div className="mt-1.5 space-y-0">
              {paused.map((s, i) => <TermStrategyRow key={s.id} strategy={s} pid={`0x${(i+active.length+1).toString().padStart(2,"0")}`} />)}
            </div>
          </div>
        )}

        <div className="border border-phos-border-dim px-3 py-2.5">
          <RiskMeter score={Math.min(10, (totalVolume / 500) * 10)} max={10} label="DAILY · SPEND" />
          <div className="text-[9px] text-phos-mid mt-1.5 tm-mono">{formatUsd(totalVolume)} / $500 · resets 00:00 UTC</div>
        </div>

        {!isLoading && (strategies?.length ?? 0) === 0 && (
          <div className="text-center py-8">
            <p className="tm-disp text-phos-hi text-lg">▢ NO · STRATEGIES ▢</p>
            <p className="text-phos-mid text-[11px] mt-2 tm-mono">follow a leader wallet to start copy-trading.</p>
            <Link href="/leaders" className="inline-block mt-3 px-6 py-2.5 border border-phos text-phos-hi text-[12px] tracking-[0.2em] tm-mono"
              style={{ textShadow: "0 0 6px #00ff66" }}>▸ BROWSE · LEADERS ◂</Link>
          </div>
        )}
      </div>
    </div>
  );
}
