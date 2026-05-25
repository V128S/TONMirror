"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatPercent } from "@/lib/format";
import { useLeaders, useFollowLeader } from "@/hooks/useLeaders";
import { useState } from "react";

export default function LeadersPage() {
  const { data: leaders, isLoading, isError } = useLeaders();
  const followMutation = useFollowLeader();
  const [followingId, setFollowingId] = useState<string | null>(null);

  const handleFollow = async (leaderId: string) => {
    setFollowingId(leaderId);
    try {
      await followMutation.mutateAsync({ leaderWalletId: leaderId });
    } finally {
      setFollowingId(null);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-text-primary">Leaders</h1>
          <Skeleton className="w-16 h-5 rounded-full" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="space-y-3">
            <Skeleton className="w-40 h-5" />
            <Skeleton className="w-full h-12" />
          </Card>
        ))}
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError || !leaders) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-text-secondary font-medium">Failed to load leaders</p>
        <p className="text-text-muted text-sm mt-1">Check your database connection and try again.</p>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (leaders.length === 0) {
    return (
      <div className="px-4 pt-6 flex flex-col items-center justify-center py-20 text-center">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-text-secondary font-medium">No leaders found</p>
        <p className="text-text-muted text-sm mt-1">Run the seed script to add demo leaders.</p>
      </div>
    );
  }

  // ── Data ─────────────────────────────────────────────────────────────────────
  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Leaders</h1>
        <Badge variant="muted">{leaders.length} wallets</Badge>
      </div>

      <div className="space-y-3">
        {leaders.map((leader) => (
          <Card key={leader.id} className="space-y-3">
            <CardHeader className="mb-0 flex flex-row items-start justify-between">
              <div>
                <CardTitle>{leader.nickname}</CardTitle>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {leader.tags.map((tag) => (
                    <Badge key={tag} variant="muted">{tag}</Badge>
                  ))}
                </div>
              </div>
              <RiskBadge score={leader.riskScore} />
            </CardHeader>

            <CardBody>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-muted">Win rate</span>
                  <p className="text-text-primary font-semibold mt-0.5">
                    {formatPercent(leader.winRateApprox)}
                  </p>
                </div>
                <div>
                  <span className="text-text-muted">Activity</span>
                  <p className="text-text-primary font-semibold mt-0.5">
                    {formatPercent(leader.activityScore)}
                  </p>
                </div>
              </div>
            </CardBody>

            <div className="flex items-center justify-between pt-1">
              {leader.isFollowing ? (
                <Badge variant="success">Following</Badge>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={followingId === leader.id || followMutation.isPending}
                  onClick={() => handleFollow(leader.id)}
                >
                  {followingId === leader.id ? "Following…" : "Follow"}
                </Button>
              )}
              {leader.notes && (
                <span className="text-text-muted text-xs truncate max-w-[140px]">
                  {leader.notes}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
