import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatUsd } from "@/lib/format";

const STRATEGIES = [
  {
    id:           "1",
    leaderName:   "Alpha Whale 🐋",
    mode:         "Fixed $10/trade",
    copiedTrades: 2,
    volume:       20,
    pnlApprox:    +4.2,
    isPaused:     false,
  },
  {
    id:           "2",
    leaderName:   "DeFi Degen 🎰",
    mode:         "Fixed $5/trade",
    copiedTrades: 0,
    volume:       0,
    pnlApprox:    0,
    isPaused:     false,
  },
  {
    id:           "3",
    leaderName:   "Steady Eddie 📈",
    mode:         "10% of leader",
    copiedTrades: 1,
    volume:       20,
    pnlApprox:    +1.1,
    isPaused:     false,
  },
];

export default function PortfolioPage() {
  const totalVolume = STRATEGIES.reduce((s, st) => s + st.volume, 0);
  const totalPnl    = STRATEGIES.reduce((s, st) => s + st.pnlApprox, 0);

  return (
    <div className="px-4 pt-6 space-y-4">
      <h1 className="text-xl font-bold text-text-primary">Portfolio</h1>

      {/* Summary row */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="py-3 text-center">
          <p className="text-xs text-text-muted">Total volume</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">{formatUsd(totalVolume)}</p>
        </Card>
        <Card className="py-3 text-center">
          <p className="text-xs text-text-muted">Est. PnL</p>
          <p className={`text-lg font-bold mt-0.5 ${totalPnl >= 0 ? "text-success" : "text-danger"}`}>
            {totalPnl >= 0 ? "+" : ""}{formatUsd(totalPnl)}
          </p>
        </Card>
      </div>

      {/* Active strategies */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary mb-2">Active Strategies</h2>
        <div className="space-y-3">
          {STRATEGIES.map((s) => (
            <Card key={s.id}>
              <CardHeader className="mb-2 flex flex-row items-center justify-between">
                <CardTitle>{s.leaderName}</CardTitle>
                <Badge variant={s.isPaused ? "warning" : "success"}>
                  {s.isPaused ? "Paused" : "Active"}
                </Badge>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-text-muted">Mode</span>
                    <p className="text-text-primary font-medium mt-0.5">{s.mode}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Trades</span>
                    <p className="text-text-primary font-medium mt-0.5">{s.copiedTrades}</p>
                  </div>
                  <div>
                    <span className="text-text-muted">Est. PnL</span>
                    <p className={`font-medium mt-0.5 ${s.pnlApprox >= 0 ? "text-success" : "text-danger"}`}>
                      {s.pnlApprox >= 0 ? "+" : ""}{formatUsd(s.pnlApprox)}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
