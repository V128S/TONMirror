"use client";

import { useState, useRef } from "react";
import Link from "next/link";

import { useTheme } from "@/components/theme/ThemeProvider";
import { type WalletBalances } from "@/hooks/useWalletBalances";
import { CopyConfirmSheet } from "@/components/activity/CopyConfirmSheet";
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { StatCell }     from "@/components/glass/Stat";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";
import { ConnectButton } from "@/components/wallet/ConnectButton";

import { formatUsd, formatRelativeTime, formatAmount } from "@/lib/format";
import { type Strategy } from "@/hooks/useStrategies";
import { type ActivityEvent } from "@/hooks/useActivity";

export interface HomeViewProps {
  strategies: Strategy[] | undefined;
  activity: ActivityEvent[] | undefined;
  stratLoading: boolean;
  actLoading: boolean;
  wallet: { isConnected: boolean; isRestored: boolean; shortAddress: string | null };
  balances?: WalletBalances;
  balLoading?: boolean;
  activeCount: number;
  copiedToday: number;
  totalVolume: number;
}

export function GlassHome({
  strategies,
  activity,
  stratLoading,
  actLoading,
  wallet,
  balances,
  balLoading,
  activeCount,
  copiedToday,
  totalVolume,
}: HomeViewProps) {
  const [confirmEvent, setConfirmEvent] = useState<ActivityEvent | null>(null);
  const { setTheme } = useTheme();

  // Hidden gesture: 5 quick taps on the "Mirror" title → terminal theme.
  const tapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({ count: 0, timer: null });
  const handleLogoTap = () => {
    const s = tapRef.current;
    if (s.timer) clearTimeout(s.timer);
    s.count += 1;
    if (s.count >= 5) {
      s.count = 0;
      setTheme("terminal");
      return;
    }
    s.timer = setTimeout(() => { s.count = 0; }, 1200);
  };

  // Only surface confirmations for fresh trades — anything older than an hour is
  // no longer actionable (the live quote would be stale) and just adds noise.
  const HOUR_MS = 3_600_000;
  const pending = (activity ?? []).filter(
    (e) =>
      e.execution != null &&
      (e.execution.status === "pending" || e.execution.status === "quoted") &&
      e.decision != null &&
      e.decision.outcome !== "rejected" &&
      Date.now() - new Date(e.timestamp).getTime() < HOUR_MS,
  );

  return (
    <div>
      <PageTitle
        overline="TON · Mirror"
        title="Mirror"
        onTitleClick={handleLogoTap}
      />

      <div className="px-4 space-y-3.5">
        {/* Hero balance */}
        <Glass hi radius={26} padding={20}>
          <div className="text-subtle" style={{ fontSize: 12, letterSpacing: "0.02em", marginBottom: 4 }}>
            Total balance
          </div>
          {stratLoading || actLoading ? (
            <GlassSkeleton className="h-10 w-44" />
          ) : (
            <div className="text-fg gl-tnum" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {formatUsd(totalVolume)}
            </div>
          )}
          <div className="mt-1.5" style={{ fontSize: 13, color: "rgb(var(--text2))" }}>
            <span className="text-fg" style={{ fontWeight: 600 }}>
              {copiedToday} copied
            </span>
            <span className="text-subtle"> &nbsp;·&nbsp; today</span>
          </div>

          <div
            className="mt-4 pt-4 grid items-center"
            style={{ gridTemplateColumns: "1fr auto 1fr", gap: 8, borderTop: "0.5px solid rgb(var(--hair) / 0.08)" }}
          >
            <div>
              <div className="text-subtle" style={{ fontSize: 11, marginBottom: 2 }}>You</div>
              <div className="font-mono text-fg" style={{ fontSize: 13, fontWeight: 500 }}>
                {wallet.shortAddress ?? "Not connected"}
              </div>
            </div>
            <svg width="42" height="22" viewBox="0 0 42 22" fill="none">
              <path d="M3 11h36" stroke="rgb(var(--text2))" strokeWidth="1" strokeDasharray="2 3"/>
              <path d="M34 6l5 5-5 5" stroke="rgb(var(--text1))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M8 6L3 11l5 5" stroke="rgb(var(--text1))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <div className="text-right">
              <div className="text-subtle" style={{ fontSize: 11, marginBottom: 2 }}>Mirroring</div>
              <div className="text-fg" style={{ fontSize: 13, fontWeight: 600 }}>
                {activeCount} {activeCount === 1 ? "leader" : "leaders"}
              </div>
            </div>
          </div>

          {wallet.isConnected && (
            <div
              className="mt-3 pt-3 grid grid-cols-3 gap-2"
              style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.08)" }}
            >
              {([["TON", balances?.TON], ["tsTON", balances?.tsTON], ["USDT", balances?.USDT]] as const).map(
                ([sym, val]) => (
                  <div key={sym} className="text-center">
                    <div className="text-subtle" style={{ fontSize: 10 }}>{sym}</div>
                    <div className="text-fg gl-tnum" style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                      {balLoading ? "…" : val == null ? "—" : formatAmount(val)}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}

          {!wallet.isConnected && (
            <div className="mt-4 flex justify-end">
              <ConnectButton compact />
            </div>
          )}
        </Glass>

        {/* Stats triad */}
        <div className="grid grid-cols-3 gap-2">
          <StatCell label="Copied · 24h" value={actLoading ? "…" : String(copiedToday)} sub="trades" />
          <StatCell label="Volume" value={actLoading ? "…" : formatUsd(totalVolume)} sub="gross" />
          <StatCell label="Strategies" value={stratLoading ? "…" : String(activeCount)} sub="active" />
        </div>

        {/* Needs your attention — pending copy confirmations */}
        {pending.length > 0 && (
          <div>
            <SectionLabel right={`${pending.length}`}>Needs your attention</SectionLabel>
            <Glass hi radius={22} padding={4}>
              {pending.slice(0, 3).map((e, i, arr) => (
                <button
                  onClick={() => setConfirmEvent(e)}
                  key={e.id}
                  className="w-full text-left grid items-center gap-3 px-3 py-3"
                  style={{
                    gridTemplateColumns: "1fr auto",
                    borderBottom: i < arr.length - 1 ? "0.5px solid rgb(var(--hair) / 0.08)" : "none",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-fg truncate" style={{ fontSize: 14, fontWeight: 600 }}>
                      {formatAmount(e.soldAmountDecimal)} {e.soldToken} → {e.boughtToken}
                    </div>
                    <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>
                      {prettyName(e.leader.nickname)} · {formatRelativeTime(e.timestamp)}
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1.5 whitespace-nowrap"
                    style={{ fontSize: 12, fontWeight: 600, background: "rgb(var(--text1))", color: "rgb(var(--bg))" }}
                  >
                    Confirm →
                  </span>
                </button>
              ))}
            </Glass>
          </div>
        )}

        {/* Mirroring now */}
        <div>
          <SectionLabel right={`${activeCount} active`}>Mirroring now</SectionLabel>
          <Glass radius={22} padding={4}>
            {stratLoading ? (
              <div className="p-2 space-y-2">
                {[1, 2].map((i) => <GlassSkeleton key={i} className="h-12" />)}
              </div>
            ) : (strategies?.filter((s) => !s.isPaused) ?? []).length === 0 ? (
              <div className="text-center py-6 text-subtle" style={{ fontSize: 12 }}>
                Not mirroring any leaders yet.
              </div>
            ) : (
              (strategies ?? []).filter((s) => !s.isPaused).slice(0, 3).map((s, i, arr) => (
                <Link
                  href={`/leaders/${s.leaderWalletId}`}
                  key={s.id}
                  className="grid items-center gap-3 px-3 py-3"
                  style={{
                    gridTemplateColumns: "40px 1fr auto",
                    borderBottom: i < arr.length - 1 ? "0.5px solid rgb(var(--hair) / 0.08)" : "none",
                  }}
                >
                  <Avatar name={s.leaderWallet.nickname} />
                  <div className="min-w-0">
                    <div className="text-fg" style={{ fontSize: 14, fontWeight: 600 }}>
                      {prettyName(s.leaderWallet.nickname)}
                    </div>
                    <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>
                      {s.mode === "fixed_amount" ? `Fixed $${s.fixedAmount ?? "?"}` : `${s.percentOfLeader ?? "?"}% of leader`}
                      {" · slip "}{(s.slippageBps / 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-fg gl-tnum" style={{ fontSize: 14, fontWeight: 600 }}>
                      {s.mode === "fixed_amount" ? `$${s.fixedAmount ?? "—"}` : `${s.percentOfLeader ?? "—"}%`}
                    </div>
                    <div className="text-subtle" style={{ fontSize: 10 }}>copy size</div>
                  </div>
                </Link>
              ))
            )}
          </Glass>
        </div>

        <Link
          href="/market"
          className="block text-center rounded-[22px] px-0 py-3.5"
          style={{
            background: "rgb(var(--text1))",
            color: "rgb(var(--bg))",
            fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
            boxShadow: "0 8px 22px -6px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.15) inset",
          }}
        >
          Discover leaders
        </Link>
      </div>

      <CopyConfirmSheet event={confirmEvent} onClose={() => setConfirmEvent(null)} />
    </div>
  );
}
