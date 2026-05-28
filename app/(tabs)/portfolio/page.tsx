"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass imports ───────────────────────────────────────────────────────
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { StatCell }     from "@/components/glass/Stat";
import { Badge as GlassBadge } from "@/components/ui/Badge";
import { Button as GlassButton } from "@/components/ui/Button";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";

// ── Terminal imports ────────────────────────────────────────────────────
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { TermHeader } from "@/components/terminal/TermHeader";
import { MirrorBar }   from "@/components/terminal/MirrorBar";
import { CornerBox }   from "@/components/terminal/CornerBox";
import { Sparkline }   from "@/components/fx/Sparkline";
import { RiskMeter }   from "@/components/fx/RiskMeter";

import { useTonAddress } from "@tonconnect/ui-react";
import { formatUsd } from "@/lib/format";
import { useStrategies, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { useTonBalance } from "@/hooks/useTonBalance";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Strategy = NonNullable<ReturnType<typeof useStrategies>["data"]>[number];

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

/* ── Page ────────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const address = useTonAddress();
  const isConnected = !!address;
  const { tonFormatted, usdFormatted, source, isLoading: balanceLoading } = useTonBalance();
  const { data: strategies, isLoading: sLoad } = useStrategies(userId ?? undefined);
  const { data: activity, isLoading: aLoad } = useActivity({ limit: 100 });

  const totalVolume  = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;
  const copiedCount  = activity?.filter((e) => e.decision?.outcome === "accepted").length ?? 0;
  const rejectedCount = activity?.filter((e) => e.decision?.outcome === "rejected").length ?? 0;
  const reviewCount  = activity?.filter((e) => e.decision?.outcome === "manual_review").length ?? 0;

  const active    = strategies?.filter((s) => !s.isPaused) ?? [];
  const paused    = strategies?.filter((s) => s.isPaused)  ?? [];
  const isLoading = sLoad || aLoad;

  const aggSpark = Array.from({ length: 22 }).map(
    (_, i) => 8 + i * 4 + Math.sin(i * 0.8) * 6,
  );

  /* ── Terminal UI ───────────────────────────────────────────────────── */
  if (theme === "terminal") {
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

  /* ── Glass UI ──────────────────────────────────────────────────────── */
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
