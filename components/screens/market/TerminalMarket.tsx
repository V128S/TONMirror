"use client";

import Link from "next/link";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { TermHeader } from "@/components/terminal/TermHeader";
import { Sparkline }  from "@/components/fx/Sparkline";

import { formatPercent, formatUsd } from "@/lib/format";
import type { MarketViewProps } from "./GlassMarket";

export function TerminalMarket({ leaders, lLoad, lError }: MarketViewProps) {
  return (
    <div>
      <TermHeader title="MARKET" sub="leaders · signals" />
      <div className="px-4 pt-2 space-y-3">
        {lLoad ? (
          [1,2,3].map((i) => <div key={i} className="border border-phos-border-dim h-20 bg-phos/5 animate-pulse" />)
        ) : lError || !leaders ? (
          <div className="text-center py-12">
            <p className="tm-disp text-phos-hi text-lg">▲ ERR_DB ▲</p>
          </div>
        ) : leaders.map((leader) => {
          const spark = Array.from({ length: 16 }).map(
            (_, i) => 40 + i * 2 + Math.sin(i * 0.7 + leader.riskScore) * 8 + leader.activityScore * 10,
          );
          return (
            <Link key={leader.id} href={`/leaders/${leader.id}`} className="block">
              <Card className="active:bg-phos/5 transition-colors">
                <CardHeader>
                  <div className="flex flex-row items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <CardTitle>{leader.nickname}</CardTitle>
                        {leader.sourceType === "auto_discovered" && (
                          <Badge variant="success" className="text-[8px] px-1 py-0">AUTO</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {leader.tags.filter(t => t !== "auto").map((tag) => (
                          <Badge key={tag} variant="muted">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    <RiskBadge score={leader.riskScore} />
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div>
                      <div className="text-[9px] text-phos-mid tracking-[0.15em]">WIN</div>
                      <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">{formatPercent(leader.winRateApprox)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-phos-mid tracking-[0.15em]">VOL·30D</div>
                      <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">
                        {leader.volumeUsd30d != null ? formatUsd(leader.volumeUsd30d) : formatPercent(leader.activityScore)}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Sparkline data={spark} width={92} height={28} fill />
                    </div>
                  </div>
                </CardBody>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-phos-border-dim">
                  {leader.isFollowing
                    ? <Badge variant="success">FOLLOWING ✓</Badge>
                    : <Badge variant="muted">▸ TAP TO FOLLOW</Badge>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
