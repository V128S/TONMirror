import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { formatPercent } from "@/lib/format";

/** Placeholder leaders — replaced with real data from /api/leaders in Phase 2 */
const SEED_LEADERS = [
  {
    id:            "1",
    nickname:      "Alpha Whale 🐋",
    tags:          ["high-frequency", "defi"],
    riskScore:     3,
    activityScore: 0.92,
    winRateApprox: 0.78,
    isFollowing:   true,
  },
  {
    id:            "2",
    nickname:      "DeFi Degen 🎰",
    tags:          ["meme", "new-tokens"],
    riskScore:     8,
    activityScore: 0.85,
    winRateApprox: 0.51,
    isFollowing:   true,
  },
  {
    id:            "3",
    nickname:      "Steady Eddie 📈",
    tags:          ["stable", "usdt-pairs"],
    riskScore:     2,
    activityScore: 0.45,
    winRateApprox: 0.69,
    isFollowing:   true,
  },
];

export default function LeadersPage() {
  return (
    <div className="px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Leaders</h1>
        <Badge variant="muted">{SEED_LEADERS.length} wallets</Badge>
      </div>

      <div className="space-y-3">
        {SEED_LEADERS.map((leader) => (
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
                <Badge variant="muted">Not following</Badge>
              )}
              <span className="text-ton-400 text-xs font-medium">View details →</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
