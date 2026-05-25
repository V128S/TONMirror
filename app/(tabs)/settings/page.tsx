"use client";

import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useTelegramUser } from "@/components/telegram/TelegramProvider";
import { isDemoMode } from "@/lib/env";
import { useEmitDemoTrade, useResetDemoData } from "@/hooks/useActivity";
import { useState } from "react";

type FeedbackState = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const user = useTelegramUser();
  const emitTrade    = useEmitDemoTrade();
  const resetDemo    = useResetDemoData();
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleEmit = async (tradeType: "profitable" | "risky" | "blocked_token") => {
    try {
      const result = await emitTrade.mutateAsync(tradeType);
      const decisionText =
        result.decisionsCreated === 0
          ? "No active strategies to evaluate."
          : `${result.decisionsCreated} decision(s) created.`;
      showFeedback(
        "success",
        `${result.trade.soldToken} → ${result.trade.boughtToken} emitted. ${decisionText}`,
      );
    } catch (err) {
      showFeedback("error", String(err));
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo.mutateAsync();
      showFeedback("success", "Demo data reset to initial state.");
    } catch (err) {
      showFeedback("error", String(err));
    }
  };

  const isPending = emitTrade.isPending || resetDemo.isPending;

  return (
    <div className="px-4 pt-6 space-y-4 pb-6">
      <h1 className="text-xl font-bold text-text-primary">Settings</h1>

      {/* Feedback toast */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          }`}
        >
          {feedback.message}
        </div>
      )}

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
          {/* TONConnectButton wired in Phase 3 */}
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

      {/* Demo controls — only shown when demo mode is enabled */}
      {isDemoMode && (
        <Card elevated>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Demo Controls</CardTitle>
              <Badge variant="warning">Demo</Badge>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Emit fake trades to demo the copy-trade pipeline.
            </p>
          </CardHeader>
          <CardBody className="space-y-2">
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              disabled={isPending}
              onClick={() => handleEmit("profitable")}
            >
              ⚡️ Emit Profitable Trade
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              disabled={isPending}
              onClick={() => handleEmit("risky")}
            >
              ⚠️ Emit Risky Trade
            </Button>
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              disabled={isPending}
              onClick={() => handleEmit("blocked_token")}
            >
              🚫 Emit Blocked-Token Trade
            </Button>
            <div className="pt-1 border-t border-surface-border" />
            <Button
              variant="danger"
              fullWidth
              size="sm"
              disabled={isPending}
              onClick={handleReset}
            >
              🔄 Reset Demo Data
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
