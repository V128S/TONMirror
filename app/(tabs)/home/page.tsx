import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

/**
 * Home screen — user status, wallet, quick stats, CTA.
 * Data fetching added in Phase 2 (TanStack Query hooks).
 */
export default function HomePage() {
  return (
    <div className="px-4 pt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">TonMirror</h1>
          <p className="text-xs text-text-muted mt-0.5">Copy the best wallets on TON</p>
        </div>
        <Badge variant="info">Demo</Badge>
      </div>

      {/* Wallet status */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text-muted">Not connected</p>
          <Link
            href="/settings"
            className="mt-3 inline-flex items-center gap-1.5 text-ton-400 text-sm font-medium"
          >
            Connect wallet →
          </Link>
        </CardBody>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Following",     value: "3" },
          { label: "Copied today",  value: "0" },
          { label: "Total volume",  value: "$0" },
        ].map((stat) => (
          <Card key={stat.label} className="text-center py-3">
            <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            <p className="text-xs text-text-muted mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Link
        href="/leaders"
        className="block w-full py-3.5 rounded-2xl bg-ton-500 text-white text-sm font-semibold text-center
                   hover:bg-ton-600 active:scale-[0.98] transition-all"
      >
        Browse Leader Wallets
      </Link>

      {/* Recent activity preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text-muted text-sm">No recent copy activity.</p>
          <Link href="/activity" className="mt-2 inline-flex text-ton-400 text-xs font-medium">
            View all activity →
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
