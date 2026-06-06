"use client";

import { useState } from "react";
import Link from "next/link";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useMultiTap } from "@/hooks/useMultiTap";
import { CopyConfirmSheet } from "@/components/activity/CopyConfirmSheet";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { TermHeader }   from "@/components/terminal/TermHeader";
import { MirrorBar }    from "@/components/terminal/MirrorBar";
import { CornerBox }    from "@/components/terminal/CornerBox";
import { ScrambleText } from "@/components/fx/ScrambleText";
import { TerminalLog }  from "@/components/fx/TerminalLog";

import { formatUsd, formatRelativeTime, formatAmount } from "@/lib/format";
import { type ActivityEvent } from "@/hooks/useActivity";
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
  const [confirmEvent, setConfirmEvent] = useState<ActivityEvent | null>(null);
  const { toggleTerminal } = useTheme();

  // Hidden gesture: 5 quick taps on the TON·MIRROR logo → back to Light/Dark.
  const handleLogoTap = useMultiTap(toggleTerminal);

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
      <TermHeader title="TON·MIRROR" sub="copy-the-alpha · v0.9.4" onTitleClick={handleLogoTap} />
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

        {/* NEEDS · CONFIRM — pending copy confirmations */}
        {pending.length > 0 && (
          <div>
            <MirrorBar label="NEEDS · CONFIRM" />
            <div className="mt-1.5 space-y-1.5">
              {pending.slice(0, 3).map((e) => (
                <button
                  key={e.id}
                  onClick={() => setConfirmEvent(e)}
                  className="w-full text-left flex items-center justify-between gap-2 border border-phos bg-phos/[0.06] px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <div className="text-[9px] text-phos-mid truncate">{e.leader.nickname} · {formatRelativeTime(e.timestamp)}</div>
                    <div className="text-[11px] text-phos-hi tm-mono mt-0.5">
                      {formatAmount(e.soldAmountDecimal)} {e.soldToken} <span className="text-phos-mid">→</span> {e.boughtToken}
                    </div>
                  </div>
                  <span className="tm-mono text-[10px] tracking-[0.15em] text-phos-hi shrink-0" style={{ textShadow: "0 0 6px #00ff66" }}>
                    CONFIRM ▸
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <MirrorBar label="SYSTEM · CONSOLE" />
          <div className="mt-1.5 border border-phos-border-dim bg-[#020806] px-2.5 py-2 max-h-[100px] overflow-hidden">
            <TerminalLog lines={BOOT_LOG} prompt="root@mirror~" speed={14} />
          </div>
        </div>

        <Link
          href="/market"
          className="block text-center px-0 py-3 border border-phos text-phos-hi tm-mono text-[12px] tracking-[0.25em] font-bold hover:bg-phos/10"
          style={{ textShadow: "0 0 6px #00ff66" }}
        >
          ▸ SCAN · NEW · LEADERS ◂
        </Link>
      </div>

      <CopyConfirmSheet event={confirmEvent} onClose={() => setConfirmEvent(null)} />
    </div>
  );
}
