"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { MirrorBar } from "@/components/terminal/MirrorBar";
import { CornerBox } from "@/components/terminal/CornerBox";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { Card } from "@/components/ui/Card";
import Link from "next/link";
import { TermStrategyRow } from "@/components/portfolio/TerminalStrategyRow";
import { TermEventRow, TERM_FILTER_MAP } from "@/components/activity/TerminalEventRow";
import type { TermFilter } from "@/components/activity/TerminalEventRow";
import { formatUsd } from "@/lib/format";
import type { ActivityViewProps } from "./GlassActivity";

export function TerminalActivity({
  events,
  strategies,
  eLoad,
  eError,
  stratLoading,
  activeCount,
  copiedToday,
  totalVolume,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<TermFilter>("ALL");

  const activeStrategies = strategies?.filter((s) => !s.isPaused) ?? [];

  const filteredEvents = events?.filter((e) => {
    const want = TERM_FILTER_MAP[filter];
    if (!want) return true;
    return e.decision?.outcome === want;
  }) ?? [];

  return (
    <div>
      <TermHeader title="ACTIVITY" sub="copies · pnl · tape" />

      {/* Terminal stat boxes */}
      <div className="px-4 pt-2 pb-3">
        <CornerBox className="border border-phos-border bg-bg-panel p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="border-l-2 border-phos-border-dim pl-1.5">
              <div className="text-[8px] text-phos-mid tracking-[0.15em]">COPIED·TODAY</div>
              <div className="tm-disp text-[18px] text-phos-hi mt-0.5">{String(copiedToday).padStart(2, "0")}</div>
            </div>
            <div className="border-l-2 border-phos-border-dim pl-1.5">
              <div className="text-[8px] text-phos-mid tracking-[0.15em]">VOLUME</div>
              <div className="tm-disp text-[18px] text-phos-hi mt-0.5">{formatUsd(totalVolume)}</div>
            </div>
            <div className="border-l-2 border-phos-border-dim pl-1.5">
              <div className="text-[8px] text-phos-mid tracking-[0.15em]">STRATEGIES</div>
              <div className="tm-disp text-[18px] text-phos-hi mt-0.5">{String(activeCount).padStart(2, "0")}</div>
            </div>
          </div>
        </CornerBox>
      </div>

      {/* Mirroring section */}
      <div className="px-4 pb-3">
        <MirrorBar label="MIRRORING" />
        <div className="mt-1.5">
          <div className="grid items-center px-2.5 py-1.5 border border-phos-border-dim border-b-0 bg-bg-el text-[8px] text-phos-mid tracking-[0.15em]"
            style={{ gridTemplateColumns: "36px 1fr auto" }}>
            <span>PID</span><span>LEADER · MODE</span><span>STAT</span>
          </div>
          {stratLoading ? (
            <div className="border border-phos-border-dim border-t-0 p-2 space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : activeStrategies.length > 0 ? (
            <div className="space-y-0">
              {activeStrategies.map((s, i) => (
                <TermStrategyRow key={s.id} strategy={s} pid={`0x${(i + 1).toString().padStart(2, "0")}`} />
              ))}
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

      {/* Feed section */}
      <div className="px-3 pt-1 space-y-2">
        <div className="flex gap-1">
          {(["ALL", "ACCEPT", "REVIEW", "REJECT"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 text-[9px] tracking-[0.15em] font-bold tm-mono ${
                filter === f ? "border border-phos bg-phos/10 text-phos-hi" : "border border-phos-border-dim text-phos-mid"
              }`}>▸ {f}</button>
          ))}
        </div>
        {eLoad ? (
          <div className="space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : eError ? (
          <div className="text-center py-12"><p className="tm-disp text-danger">▲ ERR_DB ▲</p></div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12"><p className="tm-disp text-phos-mid">▢ NO·EVENTS ▢</p></div>
        ) : (
          <div className="space-y-2">{filteredEvents.map((e) => <TermEventRow key={e.id} event={e} />)}</div>
        )}
        <div className="text-center text-[9px] text-phos-mid tm-mono pt-2">
          ─── END · OF · TAPE ··· <BlinkCaret /> ───
        </div>
      </div>
    </div>
  );
}
