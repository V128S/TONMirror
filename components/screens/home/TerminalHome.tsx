"use client";

import Link from "next/link";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { DecisionBadge } from "@/components/ui/Badge";
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
import { type HomeViewProps } from "./GlassHome";

const BOOT_LOG = [
  "tonmirror.sys v0.9.4 :: cold boot",
  "loading TON·CONNECT bridge ........ OK",
  "attaching OMNISTON quote engine .... OK",
  "subscribing to leader webhooks ..... 4 sources",
  "strategy.engine ready :: synced",
  "mirror.protocol drift 0.0014%",
];

export function TerminalHome({
  activity,
  stratLoading,
  actLoading,
  wallet,
  activeCount,
  copiedToday,
  totalVolume,
}: HomeViewProps) {
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
