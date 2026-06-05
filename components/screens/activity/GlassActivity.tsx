"use client";

import { useState } from "react";
import { Glass } from "@/components/glass/Glass";
import { PageTitle } from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { StatCell } from "@/components/glass/Stat";
import { Skeleton } from "@/components/ui/Skeleton";
import { GlassStrategyCard } from "@/components/portfolio/GlassStrategyCard";
import { GlassEventRow, GLASS_FILTER_MAP } from "@/components/activity/GlassEventRow";
import type { GlassFilter } from "@/components/activity/GlassEventRow";
import { CopyConfirmSheet } from "@/components/activity/CopyConfirmSheet";
import { formatUsd } from "@/lib/format";
import type { ActivityEvent } from "@/hooks/useActivity";
import type { Strategy } from "@/hooks/useStrategies";

export interface ActivityViewProps {
  events:       ActivityEvent[] | undefined;
  strategies:   Strategy[] | undefined;
  eLoad:        boolean;
  eError:       boolean;
  stratLoading: boolean;
  activeCount:  number;
  copiedToday:  number;
  totalVolume:  number;
}

export function GlassActivity({
  events,
  strategies,
  eLoad,
  eError,
  stratLoading,
  activeCount,
  copiedToday,
  totalVolume,
}: ActivityViewProps) {
  const [filter, setFilter] = useState<GlassFilter>("All");
  const [confirmEvent, setConfirmEvent] = useState<ActivityEvent | null>(null);

  const activeStrategies = strategies?.filter((s) => !s.isPaused) ?? [];

  const filteredEvents = events?.filter((e) => {
    const want = GLASS_FILTER_MAP[filter];
    if (!want) return true;
    return e.decision?.outcome === want;
  }) ?? [];

  return (
    <div>
      <PageTitle overline="Your copies" title="Activity" />

      {/* Stat triad */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-4">
        <StatCell label="Copied · today" value={String(copiedToday).padStart(2, "0")} />
        <StatCell label="Volume" value={formatUsd(totalVolume)} />
        <StatCell label="Strategies" value={String(activeCount).padStart(2, "0")} />
      </div>

      {/* Mirroring section */}
      <div className="px-4 mb-4">
        <SectionLabel>Mirroring</SectionLabel>
        {stratLoading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-[22px]" />)}
          </div>
        ) : activeStrategies.length > 0 ? (
          <div className="space-y-2.5">
            {activeStrategies.map((s) => <GlassStrategyCard key={s.id} s={s} />)}
          </div>
        ) : (
          <div className="text-center py-4 text-subtle" style={{ fontSize: 12 }}>
            Not mirroring any leaders yet.
          </div>
        )}
      </div>

      {/* Today feed */}
      <div className="px-4 space-y-3.5">
        <div className="flex gap-1.5 overflow-x-auto scroll-hide">
          {(["All", "Accepted", "Review", "Rejected"] as GlassFilter[]).map((f) => {
            const on = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-full px-3.5 py-2 whitespace-nowrap transition-colors"
                style={{
                  fontSize: 12, fontWeight: on ? 600 : 500,
                  background: on ? "rgb(var(--text1))" : "var(--glass)",
                  color: on ? "rgb(var(--bg))" : "rgb(var(--text2))",
                  border: on ? "0.5px solid rgb(var(--text1))" : "0.5px solid var(--glass-edge)",
                  WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
                }}>
                {f}
              </button>
            );
          })}
        </div>
        <div>
          <SectionLabel right={`${filteredEvents.length} events`}>Today</SectionLabel>
          <Glass radius={22} padding={0} className="overflow-hidden">
            {eLoad ? (
              <div className="p-3 space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} className="h-14" />)}</div>
            ) : eError ? (
              <div className="text-center py-12 text-subtle">Couldn&apos;t load activity.</div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-12 text-subtle" style={{ fontSize: 12 }}>No events match this filter.</div>
            ) : (
              filteredEvents.map((e, i) => (
                <GlassEventRow
                  key={e.id}
                  event={e}
                  last={i === filteredEvents.length - 1}
                  onConfirm={setConfirmEvent}
                />
              ))
            )}
          </Glass>
        </div>
        <div className="text-center text-subtle pt-1 pb-1" style={{ fontSize: 11 }}>End of feed</div>
      </div>

      <CopyConfirmSheet event={confirmEvent} onClose={() => setConfirmEvent(null)} />
    </div>
  );
}
