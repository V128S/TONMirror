"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTelegramUser } from "@/components/telegram/TelegramProvider";
import { isDemoMode } from "@/lib/env";

export default function SettingsPage() {
  const user = useTelegramUser();

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      {/* Telegram profile */}
      <Card>
        <CardHeader>
          <CardTitle>Telegram Profile</CardTitle>
        </CardHeader>
        <CardBody>
          {user ? (
            <div className="space-y-1">
              <p className="text-text-primary font-medium">
                {user.firstName} {user.lastName ?? ""}
              </p>
              {user.username && (
                <p className="text-text-muted text-sm">@{user.username}</p>
              )}
              <p className="text-text-muted text-xs">ID: {user.id}</p>
            </div>
          ) : (
            <p className="text-text-muted">Loading…</p>
          )}
        </CardBody>
      </Card>

      {/* Wallet */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-text-muted text-sm mb-3">No wallet connected.</p>
          {/* TONConnectButton added in Phase 2 when @tonconnect/ui-react is wired */}
          <Button variant="secondary" size="sm">Connect TON Wallet</Button>
        </CardBody>
      </Card>

      {/* Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Defaults</CardTitle>
        </CardHeader>
        <CardBody className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Default slippage</span>
            <span className="text-text-primary font-medium">1.00%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Daily limit</span>
            <span className="text-text-primary font-medium">No limit</span>
          </div>
        </CardBody>
      </Card>

      {/* Demo controls */}
      {isDemoMode && (
        <Card elevated>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Demo Controls</CardTitle>
              <Badge variant="warning">Demo</Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-2">
            <Button variant="secondary" fullWidth size="sm">
              ⚡️ Emit Profitable Trade
            </Button>
            <Button variant="secondary" fullWidth size="sm">
              ⚠️ Emit Risky Trade
            </Button>
            <Button variant="secondary" fullWidth size="sm">
              🚫 Emit Blocked-Token Trade
            </Button>
            <Button variant="danger" fullWidth size="sm">
              🔄 Reset Demo Data
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
