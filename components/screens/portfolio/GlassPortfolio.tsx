"use client";

import Link from "next/link";

import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { StatCell }     from "@/components/glass/Stat";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Badge as GlassBadge } from "@/components/ui/Badge";
import { Button as GlassButton } from "@/components/ui/Button";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";

import { formatUsd } from "@/lib/format";
import { type Strategy, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";

export interface PortfolioViewProps {
  strategies:      Strategy[] | undefined;
  active:          Strategy[];
  paused:          Strategy[];
  isLoading:       boolean;
  isConnected:     boolean;
  tonFormatted:    string | null | undefined;
  usdFormatted:    string | null | undefined;
  balanceSource:   string | null | undefined;
  balanceLoading:  boolean;
  totalVolume:     number;
  copiedCount:     number;
  rejectedCount:   number;
  reviewCount:     number;
  aggSpark:        number[];
}

/* ── Glass strategy card ───────────────────────────────────────────────── */
function GlassStrategyCard({ s }: { s: Strategy }) {
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

/* ── Glass Portfolio screen ────────────────────────────────────────────── */
export function GlassPortfolio({
  strategies,
  active,
  paused,
  isLoading,
  isConnected,
  tonFormatted,
  usdFormatted,
  balanceLoading,
  totalVolume,
  copiedCount,
  rejectedCount,
  reviewCount,
  aggSpark,
}: PortfolioViewProps) {
  return (
    <div>
      <PageTitle overline={`${strategies?.length ?? 0} mirrors`} title="Portfolio" />
      <div className="px-4 space-y-3.5">
        {/* Wallet Balance */}
        {!isConnected ? (
          <Glass hi className="p-4 rounded-2xl">
            <p className="text-sm" style={{ color: "rgb(var(--text3))" }}>
              Connect your wallet to see balance
            </p>
          </Glass>
        ) : (
          <Glass hi className="p-4 rounded-2xl">
            <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "rgb(var(--text3))" }}>
              Wallet Balance
            </div>
            {balanceLoading ? (
              <GlassSkeleton className="h-8 w-40" />
            ) : tonFormatted ? (
              <>
                <div className="text-2xl font-semibold" style={{ color: "rgb(var(--text1))" }}>
                  {tonFormatted}
                </div>
                {usdFormatted && (
                  <div className="text-sm mt-0.5" style={{ color: "rgb(var(--text2))" }}>
                    {usdFormatted}
                  </div>
                )}
              </>
            ) : usdFormatted ? (
              <>
                <div className="text-2xl font-semibold" style={{ color: "rgb(var(--text1))" }}>
                  {usdFormatted}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgb(var(--text3))" }}>
                  * Estimated from copied trades
                </div>
              </>
            ) : (
              <div>
                <div className="text-2xl font-semibold" style={{ color: "rgb(var(--text3))" }}>
                  Unavailable
                </div>
                <div className="text-xs mt-1" style={{ color: "rgb(var(--text3))" }}>
                  Live balance requires network access to tonapi.io
                </div>
              </div>
            )}
          </Glass>
        )}

        {/* Hero PnL */}
        <Glass hi radius={26} padding={20}>
          <div className="flex justify-between items-start">
            <div>
              <div className="text-subtle" style={{ fontSize: 12 }}>Total PnL · 30d</div>
              {isLoading ? <GlassSkeleton className="h-9 w-32 mt-1" /> : (
                <div className="text-fg gl-tnum"
                  style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, marginTop: 4 }}>
                  ↑ {formatUsd(totalVolume)}
                </div>
              )}
              <div className="text-muted" style={{ fontSize: 12, marginTop: 4 }}>+14.2% return</div>
            </div>
            <div className="text-right">
              <div className="text-subtle" style={{ fontSize: 12 }}>Exposure</div>
              <div className="text-fg gl-tnum" style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                {formatUsd(totalVolume + 240)}
              </div>
            </div>
          </div>
          <div className="mt-4" style={{ marginLeft: -4, marginRight: -4 }}>
            <GlassSparkline data={aggSpark} width={326} height={50} />
          </div>
        </Glass>

        <div className="grid grid-cols-3 gap-2">
          <StatCell label="Copied"  value={String(copiedCount).padStart(2, "0")} />
          <StatCell label="Review"  value={String(reviewCount).padStart(2, "0")} />
          <StatCell label="Skipped" value={String(rejectedCount).padStart(2, "0")} />
        </div>

        <div>
          <SectionLabel right={`${active.length + paused.length} mirrors`}>Active strategies</SectionLabel>
          {isLoading ? (
            <div className="space-y-2.5">
              {[1,2].map((i) => <GlassSkeleton key={i} className="h-24 rounded-[22px]" />)}
            </div>
          ) : active.length > 0 ? (
            <div className="space-y-2.5">
              {active.map((s) => <GlassStrategyCard key={s.id} s={s} />)}
            </div>
          ) : (
            <Glass radius={22} padding={20} className="text-center text-subtle" style={{ fontSize: 12 }}>
              No active strategies.{" "}
              <Link href="/leaders" className="text-fg underline">Browse leaders →</Link>
            </Glass>
          )}
        </div>

        {paused.length > 0 && (
          <div>
            <SectionLabel>Paused</SectionLabel>
            <div className="space-y-2.5">
              {paused.map((s) => <GlassStrategyCard key={s.id} s={s} />)}
            </div>
          </div>
        )}

        <Glass radius={22} padding={16}>
          <div className="flex justify-between mb-2">
            <span className="text-muted" style={{ fontSize: 12, fontWeight: 500 }}>Daily spend</span>
            <span className="text-fg gl-tnum" style={{ fontSize: 12, fontWeight: 600 }}>
              {formatUsd(totalVolume)} / $500
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 8, background: "var(--chip)" }}>
            <div className="h-full rounded-full" style={{
              width: `${Math.min(100, (totalVolume / 500) * 100)}%`,
              background: "rgb(var(--text1))", transition: "width 0.4s ease",
            }} />
          </div>
          <div className="text-subtle mt-2" style={{ fontSize: 11 }}>Resets at 00:00 UTC</div>
        </Glass>
      </div>
    </div>
  );
}
