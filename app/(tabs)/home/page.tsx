"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass imports ────────────────────────────────────────────────────────
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { StatCell }     from "@/components/glass/Stat";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";

// ── Terminal imports ─────────────────────────────────────────────────────
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, DecisionBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { TermHeader }   from "@/components/terminal/TermHeader";
import { MirrorBar }    from "@/components/terminal/MirrorBar";
import { CornerBox }    from "@/components/terminal/CornerBox";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { LiveFeed, type FeedEvent } from "@/components/fx/LiveFeed";
import { TerminalLog }  from "@/components/fx/TerminalLog";
import { BlinkCaret }   from "@/components/fx/BlinkCaret";

import { formatUsd, formatRelativeTime, formatAmount } from "@/lib/format";
import { useStrategies } from "@/hooks/useStrategies";
import { useActivity }   from "@/hooks/useActivity";
import { useWallet }     from "@/hooks/useWallet";

const BOOT_LOG = [
  "tonmirror.sys v0.9.4 :: cold boot",
  "loading TON·CONNECT bridge ........ OK",
  "attaching OMNISTON quote engine .... OK",
  "subscribing to leader webhooks ..... 4 sources",
  "strategy.engine ready :: synced",
  "mirror.protocol drift 0.0014%",
];

export default function HomePage() {
  const { theme } = useTheme();
  const { data: strategies, isLoading: stratLoading } = useStrategies();
  const { data: activity,   isLoading: actLoading  } = useActivity({ limit: 10 });
  const wallet = useWallet();

  const activeCount  = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday  = activity?.filter(
    (e) => e.decision?.outcome === "accepted" &&
           new Date(e.timestamp).toDateString() === new Date().toDateString(),
  ).length ?? 0;
  const totalVolume  = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;

  /* ── Terminal UI ─────────────────────────────────────────────────────── */
  if (theme === "terminal") {
    const feed: FeedEvent[] =
      activity?.slice(0, 8).map((e) => ({
        t: new Date(e.timestamp).toLocaleTimeString("en-GB", { hour12: false }),
        who: e.leader.nickname,
        action: `${e.soldAmountDecimal ? formatAmount(e.soldAmountDecimal) : ""} ${e.soldToken} → ${e.boughtToken}`,
        pnl: Math.round(e.usdEstimate ?? 0),
      })) ?? [];

    return (
      <div>
        <TermHeader title="TON·MIRROR" sub="copy-the-alpha · v0.9.4" />
        <div className="px-4 pt-2 space-y-3.5">
          <div>
            <MirrorBar label="WALLET · MIRROR" />
            <CornerBox className="mt-2 border border-phos-border bg-bg-panel px-3 py-3.5">
              <div className="grid grid-cols-2 gap-0 relative">
                <div className="pr-2.5">
                  <div className="text-[9px] text-phos-mid tracking-[0.18em]">:: YOU</div>
                  {!wallet.isRestored ? (
                    <Skeleton className="h-5 w-24 mt-1" />
                  ) : (
                    <div className="tm-disp tm-glow text-base mt-1 text-phos-hi">
                      <ScrambleText value={wallet.shortAddress ?? "Not connected"} />
                    </div>
                  )}
                  <div className="mt-1.5 text-[10px] text-phos-soft">
                    status: <span className="tm-glow">{wallet.isConnected ? "LINKED" : "OFFLINE"}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-phos-mid">
                    strategies: {stratLoading ? "…" : `${activeCount} ACTIVE`}
                  </div>
                </div>
                <div
                  className="absolute left-1/2 top-2 bottom-2 w-px"
                  style={{
                    background: "linear-gradient(180deg, transparent, #00ff66 30%, #00ff66 70%, transparent)",
                    boxShadow: "0 0 6px #00ff66",
                  }}
                />
                <div className="pl-3.5 text-right">
                  <div className="text-[9px] text-phos-mid tracking-[0.18em]">LEADERS ::</div>
                  <div className="tm-disp tm-glow text-base mt-1 text-phos-hi">
                    <ScrambleText value={`${activeCount} FOLLOWED`} />
                  </div>
                  <div className="mt-1.5 text-[10px] text-phos-soft">
                    copied/24h: <span className="tm-glow">{copiedToday}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-phos-mid">vol: {formatUsd(totalVolume)}</div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 flex justify-between items-center text-[9px] text-phos-mid border-t border-dashed border-phos-border-dim">
                <span>◢ drift: <span className="text-phos-soft">0.0014%</span></span>
                <span>last sync: <span className="tm-blink text-phos">NOW</span></span>
              </div>
              <div className="mt-3 flex justify-end">
                <ConnectButton compact={wallet.isConnected} />
              </div>
            </CornerBox>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { k: "FOLLOW", v: stratLoading ? "…" : String(activeCount).padStart(2, "0"), s: "leaders" },
              { k: "COPIED", v: actLoading ? "…" : String(copiedToday).padStart(2, "0"),  s: "today" },
              { k: "VOL·24", v: actLoading ? "…" : formatUsd(totalVolume),                s: "gross" },
            ].map((c) => (
              <div key={c.k} className="border border-phos-border-dim p-2" style={{ background: "rgba(0,255,102,0.03)" }}>
                <div className="text-[9px] text-phos-mid tracking-[0.15em]">[{c.k}]</div>
                <div className="tm-disp tm-glow text-[19px] text-phos-hi mt-0.5">{c.v}</div>
                <div className="text-[8px] text-phos-mid mt-0.5">{c.s}</div>
              </div>
            ))}
          </div>
          <div>
            <MirrorBar label="SYSTEM · CONSOLE" />
            <div className="mt-1.5 border border-phos-border-dim bg-[#020806] px-2.5 py-2 max-h-[100px] overflow-hidden">
              <TerminalLog lines={BOOT_LOG} prompt="root@mirror~" speed={14} />
            </div>
          </div>
          <div>
            <MirrorBar label="LEADERS · TAPE" />
            <div className="mt-1.5 border border-phos-border-dim bg-bg-panel px-2.5 py-1.5">
              {actLoading || feed.length === 0 ? (
                <div className="py-6 text-center text-[10px] text-phos-mid"><BlinkCaret /> awaiting signal…</div>
              ) : (
                <LiveFeed events={feed} height={132} />
              )}
            </div>
          </div>
          <Link
            href="/leaders"
            className="block text-center px-0 py-3 border border-phos text-phos-hi tm-mono text-[12px] tracking-[0.25em] font-bold hover:bg-phos/10"
            style={{ textShadow: "0 0 6px #00ff66" }}
          >
            ▸ SCAN · NEW · LEADERS ◂
          </Link>
          {activity && activity.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recent Events</CardTitle></CardHeader>
              <CardBody className="space-y-2">
                {activity.slice(0, 3).map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-phos-mid truncate">{event.leader.nickname}</p>
                      <p className="text-[11px] text-phos-hi tm-mono">
                        {formatAmount(event.soldAmountDecimal)} {event.soldToken}{" "}
                        <span className="text-phos-mid">→</span> {event.boughtToken}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {event.decision && <DecisionBadge decision={event.decision.outcome} />}
                      <span className="text-[9px] text-phos-mid">{formatRelativeTime(event.timestamp)}</span>
                    </div>
                  </div>
                ))}
                <Link href="/activity" className="inline-flex text-phos-soft text-[10px] mt-1">View all activity →</Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    );
  }

  /* ── Glass UI ────────────────────────────────────────────────────────── */
  return (
    <div>
      <PageTitle
        overline="TON · Mirror"
        title="Mirror"
        right={
          <Glass radius={20} padding={0} className="w-10 h-10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgb(var(--text1))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>
            </svg>
          </Glass>
        }
      />

      <div className="px-4 space-y-3.5">
        {/* Hero balance */}
        <Glass hi radius={26} padding={20}>
          <div className="text-subtle" style={{ fontSize: 12, letterSpacing: "0.02em", marginBottom: 4 }}>
            Total balance
          </div>
          {stratLoading ? (
            <GlassSkeleton className="h-10 w-44" />
          ) : (
            <div className="text-fg gl-tnum" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>
              {formatUsd(totalVolume || 3420.18)}
            </div>
          )}
          <div className="mt-1.5" style={{ fontSize: 13, color: "rgb(var(--text2))" }}>
            <span className="text-fg" style={{ fontWeight: 600 }}>
              ↑ {formatUsd(activity ? Math.max(0, totalVolume * 0.04) : 124.4)}
            </span>
            <span className="text-subtle"> &nbsp;·&nbsp; 24h</span>
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
          <StatCell label="Win rate" value="71%" sub="30d" />
        </div>

        {/* Active leaders */}
        <div>
          <SectionLabel right={`${activeCount} active`}>Following</SectionLabel>
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
              (strategies ?? []).filter((s) => !s.isPaused).slice(0, 4).map((s, i, arr) => (
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
                      ↑ ${(s.leaderWallet.riskScore * 3 + 8).toFixed(1)}k
                    </div>
                    <div className="text-subtle" style={{ fontSize: 10 }}>30d</div>
                  </div>
                </Link>
              ))
            )}
          </Glass>
        </div>

        {/* Live tape */}
        <div>
          <SectionLabel
            right={
              <span className="text-muted" style={{ animation: "gl-pulse 3s ease-in-out infinite" }}>
                ● Live
              </span>
            }
          >
            Recent activity
          </SectionLabel>
          <Glass radius={22} padding={4}>
            {actLoading ? (
              <div className="p-2 space-y-2">
                {[1, 2, 3].map((i) => <GlassSkeleton key={i} className="h-10" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              activity.slice(0, 4).map((e, i, arr) => {
                const pnl = Math.round(e.usdEstimate ?? 0);
                const up  = pnl >= 0;
                return (
                  <div
                    key={e.id}
                    className="grid items-center gap-2.5 px-3 py-2.5"
                    style={{ gridTemplateColumns: "52px 1fr auto", borderBottom: i < arr.length - 1 ? "0.5px solid rgb(var(--hair) / 0.08)" : "none" }}
                  >
                    <span className="font-mono text-subtle" style={{ fontSize: 11 }}>
                      {new Date(e.timestamp).toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5)}
                    </span>
                    <div className="min-w-0">
                      <div className="text-fg truncate" style={{ fontSize: 13, fontWeight: 500 }}>
                        {formatAmount(e.soldAmountDecimal)} {e.soldToken} → {e.boughtToken}
                      </div>
                      <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>
                        {prettyName(e.leader.nickname)} · {formatRelativeTime(e.timestamp)}
                      </div>
                    </div>
                    <span className="gl-tnum" style={{ fontSize: 13, fontWeight: 600, color: up ? "rgb(var(--text1))" : "rgb(var(--text3))" }}>
                      {up ? "↑" : "↓"} ${Math.abs(pnl)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-subtle" style={{ fontSize: 12 }}>Awaiting signal…</div>
            )}
          </Glass>
        </div>

        <Link
          href="/leaders"
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
    </div>
  );
}
