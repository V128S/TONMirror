"use client";

import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { Sparkline } from "@/components/fx/Sparkline";
import { formatPercent, formatUsd } from "@/lib/format";
import { useLeaders } from "@/hooks/useLeaders";

export default function LeadersPage() {
  const { data: leaders, isLoading, isError } = useLeaders();

  if (isLoading) {
    return (
      <div>
        <TermHeader title="LEADERS" sub="discover · wallets" />
        <div className="px-4 pt-2 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="w-40 h-5" />
              <Skeleton className="w-full h-12" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !leaders) {
    return (
      <div>
        <TermHeader title="LEADERS" sub="discover · wallets" />
        <div className="px-4 pt-12 text-center">
          <p className="tm-disp text-phos-hi text-lg">▲ ERR_DB ▲</p>
          <p className="text-phos-mid text-sm mt-1">database connection refused.</p>
        </div>
      </div>
    );
  }

  if (leaders.length === 0) {
    return (
      <div>
        <TermHeader title="LEADERS" sub="discover · wallets" />
        <div className="px-4 pt-12 text-center">
          <p className="tm-disp text-phos-hi text-lg">▢ NO·LEADERS ▢</p>
          <p className="text-phos-mid text-sm mt-1">run the seed script.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TermHeader title="LEADERS" sub={`${leaders.length} wallets · discover`} />
      <div className="px-4 pt-2 space-y-3">
        {leaders.map((leader) => {
          // synthetic spark — replace with real history when you store it
          const spark = Array.from({ length: 16 }).map((_, i) =>
            40 + i * 2 + Math.sin(i * 0.7 + leader.riskScore) * 8 + leader.activityScore * 10,
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
                        {leader.tags
                          .filter(t => t !== "auto")
                          .map((tag) => (
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
                      <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">
                        {formatPercent(leader.winRateApprox)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-phos-mid tracking-[0.15em]">
                        {leader.volumeUsd30d != null ? "VOL·30D" : "ACT"}
                      </div>
                      <div className="tm-disp tm-glow text-phos-hi text-[15px] mt-0.5">
                        {leader.volumeUsd30d != null
                          ? formatUsd(leader.volumeUsd30d)
                          : formatPercent(leader.activityScore)}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Sparkline data={spark} width={92} height={28} fill />
                    </div>
                  </div>
                  {leader.sourceType === "auto_discovered" && leader.discoveryScore != null && (
                    <div className="mt-2 pt-2 border-t border-dashed border-phos-border-dim flex justify-between text-[9px] tm-mono text-phos-mid">
                      <span>SCORE <span className="text-phos-soft">{leader.discoveryScore.toFixed(2)}</span></span>
                      {leader.tradeCount30d != null && (
                        <span>{leader.tradeCount30d} TRADES·30D</span>
                      )}
                    </div>
                  )}
                </CardBody>

                <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed border-phos-border-dim">
                  {leader.isFollowing ? (
                    <Badge variant="success">FOLLOWING ✓</Badge>
                  ) : (
                    <Badge variant="muted">▸ TAP TO FOLLOW</Badge>
                  )}
                  {leader.notes && (
                    <span className="text-phos-mid text-[10px] truncate max-w-[140px] tm-mono">
                      {leader.notes}
                    </span>
                  )}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
