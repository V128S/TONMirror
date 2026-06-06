"use client";

import Link from "next/link";
import { useState } from "react";

import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Badge as GlassBadge, RiskBadge } from "@/components/ui/Badge";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";
import { BottomSheet } from "@/components/ui/BottomSheet";

import { formatPercent, formatUsd } from "@/lib/format";
import type { Leader } from "@/hooks/useLeaders";

// ── Types ─────────────────────────────────────────────────────────────────
export interface MarketViewProps {
  leaders: Leader[] | undefined;
  lLoad:   boolean;
  lError:  boolean;
}

// ── Leader Bottom Sheet content ───────────────────────────────────────────
function LeaderSheetContent({ leader, onClose }: { leader: Leader; onClose: () => void }) {
  const spark = Array.from({ length: 7 }).map(
    (_, i) => 40 + i * 3 + Math.sin(i * 0.9 + leader.riskScore) * 10,
  );
  return (
    <div className="px-4 pb-4">
      <div className="grid items-center gap-3 mb-5" style={{ gridTemplateColumns: "52px 1fr auto" }}>
        <Avatar name={leader.nickname} size={52} />
        <div>
          <div className="text-fg" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>
            {prettyName(leader.nickname)}
          </div>
          <div className="text-subtle mt-0.5" style={{ fontSize: 12 }}>
            {leader.address.slice(0, 6)}…{leader.address.slice(-4)}
          </div>
        </div>
        <RiskBadge score={leader.riskScore} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        {[
          { label: "Win Rate", value: formatPercent(leader.winRateApprox) },
          { label: "Vol 30d",  value: leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : "—" },
          { label: "Trades",   value: leader.tradeCount30d != null ? String(leader.tradeCount30d) : "—" },
        ].map((s) => (
          <Glass key={s.label} radius={14} padding={10} className="text-center">
            <div className="text-subtle" style={{ fontSize: 10 }}>{s.label}</div>
            <div className="text-fg gl-tnum mt-1" style={{ fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </Glass>
        ))}
      </div>

      <div className="mb-5">
        <GlassSparkline data={spark} width={320} height={52} />
      </div>

      <Link
        href={`/leaders/${leader.id}`}
        onClick={onClose}
        className="block w-full rounded-full py-3 text-center font-semibold transition-colors"
        style={{
          fontSize: 14,
          background: "rgb(var(--text1))",
          color: "rgb(var(--bg))",
          boxShadow: "0 8px 22px -6px rgba(0,0,0,0.3)",
        }}
      >
        Open full profile →
      </Link>
    </div>
  );
}

export function GlassMarket({ leaders, lLoad, lError }: MarketViewProps) {
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

  return (
    <div>
      <PageTitle overline="Discover" title="Leaders" />

      <div className="px-4 space-y-3">
        <SectionLabel right="By PnL · 30d">All leaders</SectionLabel>
        {lLoad ? (
          [1,2,3].map((i) => <GlassSkeleton key={i} className="h-28 rounded-[22px]" />)
        ) : lError || !leaders ? (
          <div className="text-center pt-12 text-subtle">Couldn&apos;t load leaders.</div>
        ) : leaders.length === 0 ? (
          <div className="text-center pt-12 text-subtle">No leaders to show yet — whale discovery runs daily.</div>
        ) : leaders.map((leader) => {
          const spark = Array.from({ length: 16 }).map(
            (_, i) => 40 + i * 2 + Math.sin(i * 0.7 + leader.riskScore) * 8 + leader.activityScore * 10,
          );
          return (
            <button key={leader.id} className="w-full text-left" onClick={() => setSelectedLeader(leader)}>
              <Glass radius={22} padding={16}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: "44px 1fr auto" }}>
                  <Avatar name={leader.nickname} size={44} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-fg" style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                        {prettyName(leader.nickname)}
                      </div>
                      {leader.sourceType === "auto_discovered" && (
                        <GlassBadge variant="success" className="text-[9px]">AUTO</GlassBadge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {leader.tags.filter(t => t !== "auto").slice(0, 3).map((tag) => (
                        <GlassBadge key={tag} variant="muted">{tag.toLowerCase()}</GlassBadge>
                      ))}
                    </div>
                  </div>
                  <RiskBadge score={leader.riskScore} />
                </div>

                <div className="mt-3.5 pt-3.5 grid items-end gap-2"
                  style={{ gridTemplateColumns: "1fr 1fr auto", borderTop: "0.5px solid rgb(var(--hair) / 0.06)" }}>
                  <div>
                    <div className="text-subtle" style={{ fontSize: 10 }}>Win rate</div>
                    <div className="text-fg gl-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                      {formatPercent(leader.winRateApprox)}
                    </div>
                  </div>
                  <div>
                    <div className="text-subtle" style={{ fontSize: 10 }}>Vol · 30d</div>
                    <div className="text-fg gl-tnum" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
                      {leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : formatPercent(leader.activityScore)}
                    </div>
                  </div>
                  <GlassSparkline data={spark} width={92} height={32} />
                </div>

                <div className="mt-3 pt-2.5 flex items-center justify-between"
                  style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.06)" }}>
                  {leader.isFollowing
                    ? <GlassBadge variant="success">Following ✓</GlassBadge>
                    : <GlassBadge variant="muted">Tap to preview →</GlassBadge>}
                </div>
              </Glass>
            </button>
          );
        })}
      </div>

      <BottomSheet isOpen={selectedLeader !== null} onClose={() => setSelectedLeader(null)} heightPercent={88}>
        {selectedLeader && (
          <LeaderSheetContent leader={selectedLeader} onClose={() => setSelectedLeader(null)} />
        )}
      </BottomSheet>
    </div>
  );
}
