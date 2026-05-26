"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TermHeader } from "@/components/terminal/TermHeader";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useTelegramUser } from "@/components/telegram/TelegramProvider";
import { useWallet } from "@/hooks/useWallet";
import { isDemoMode } from "@/lib/env";
import { useEmitDemoTrade, useResetDemoData } from "@/hooks/useActivity";
import { useRunWhaleScanner, type ScanResult } from "@/hooks/useWhaleScanner";
import { formatUsd } from "@/lib/format";

type FeedbackState = { type: "success" | "error"; message: string } | null;

export default function SettingsPage() {
  const user = useTelegramUser();
  const wallet = useWallet();
  const emitTrade = useEmitDemoTrade();
  const resetDemo = useResetDemoData();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const scanner    = useRunWhaleScanner();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleEmit = async (tradeType: "profitable" | "risky" | "blocked_token") => {
    try {
      const result = await emitTrade.mutateAsync(tradeType);
      const dec =
        result.decisionsCreated === 0
          ? "no active strategies to evaluate."
          : `${result.decisionsCreated} decision(s) created.`;
      showFeedback(
        "success",
        `${result.trade.soldToken} → ${result.trade.boughtToken} emitted. ${dec}`,
      );
    } catch (err) {
      showFeedback("error", String(err));
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo.mutateAsync();
      showFeedback("success", "demo data reset to initial state.");
    } catch (err) {
      showFeedback("error", String(err));
    }
  };

  const isPending = emitTrade.isPending || resetDemo.isPending;

  return (
    <div>
      <TermHeader title="SETTINGS" sub="conf · profile · wallet" />

      <div className="px-4 pt-2 space-y-3.5">
        {feedback && (
          <div
            className={`px-3 py-2 text-[11px] tm-mono border ${
              feedback.type === "success"
                ? "border-phos text-phos-hi bg-phos/10"
                : "border-danger text-danger bg-danger/10"
            }`}
          >
            {feedback.type === "success" ? "◆ " : "✕ "}
            {feedback.message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>TELEGRAM · PROFILE</CardTitle>
          </CardHeader>
          <CardBody>
            {user ? (
              <div className="space-y-1 tm-mono text-[11px]">
                <p className="text-phos-hi">
                  {user.firstName} {user.lastName ?? ""}
                </p>
                {user.username && <p className="text-phos-soft">@{user.username}</p>}
                <p className="text-phos-mid text-[10px]">ID: {user.id}</p>
              </div>
            ) : (
              <p className="text-phos-mid text-[11px] tm-mono">loading…</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TON · WALLET</CardTitle>
          </CardHeader>
          <CardBody>
            {wallet.isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="size-2 bg-phos tm-blink shrink-0" style={{ boxShadow: "0 0 6px #00ff66" }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-phos-hi text-[11px] tm-mono truncate">{wallet.address}</p>
                    {wallet.walletName && (
                      <p className="text-phos-mid text-[10px] mt-0.5">{wallet.walletName}</p>
                    )}
                  </div>
                </div>
                <ConnectButton />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-phos-mid text-[11px] tm-mono">
                  connect TON wallet to sign copy-trade transactions.
                </p>
                <ConnectButton />
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>DEFAULTS</CardTitle>
          </CardHeader>
          <CardBody className="space-y-1.5">
            <div className="flex justify-between text-[11px] tm-mono">
              <span className="text-phos-soft">▸ Default slippage</span>
              <span className="text-phos-hi">1.00%</span>
            </div>
            <div className="flex justify-between text-[11px] tm-mono">
              <span className="text-phos-soft">▸ Daily limit</span>
              <span className="text-phos-hi">$500</span>
            </div>
          </CardBody>
        </Card>

        {isDemoMode && (
          <Card elevated>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>DEMO · CONTROLS</CardTitle>
                <Badge variant="warning">DEMO</Badge>
              </div>
              <p className="text-[10px] text-phos-mid mt-1 tm-mono">
                emit fake trades to demo the pipeline.
              </p>
            </CardHeader>
            <CardBody className="space-y-1.5">
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                disabled={isPending}
                onClick={() => handleEmit("profitable")}
              >
                ⚡ EMIT · PROFITABLE
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                disabled={isPending}
                onClick={() => handleEmit("risky")}
              >
                ⚠ EMIT · RISKY
              </Button>
              <Button
                variant="secondary"
                fullWidth
                size="sm"
                disabled={isPending}
                onClick={() => handleEmit("blocked_token")}
              >
                ⊘ EMIT · BLOCKED
              </Button>
              <div className="pt-1 border-t border-phos-border-dim" />
              <Button
                variant="danger"
                fullWidth
                size="sm"
                disabled={isPending}
                onClick={handleReset}
              >
                ↻ RESET · DEMO · DATA
              </Button>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>WHALE·SCANNER</CardTitle>
              <Badge variant="muted">AUTO</Badge>
            </div>
            <p className="text-[10px] text-phos-mid mt-1 tm-mono">
              discover profitable wallets from STON.fi + TonAPI
            </p>
          </CardHeader>
          <CardBody className="space-y-1.5">
            {scanResult && (
              <div className="px-2 py-1.5 border border-phos-border-dim bg-phos/5 text-[10px] tm-mono text-phos-soft space-y-0.5">
                {scanResult.whales ? (
                  <>
                    <p className="text-phos-hi">DRY·RUN — {scanResult.whales.length} whales found</p>
                    {scanResult.whales.slice(0, 5).map(w => (
                      <p key={w.address}>
                        ◈ {w.nickname} score:{w.score.toFixed(2)} vol:{formatUsd(w.volumeUsd30d)}
                      </p>
                    ))}
                    {scanResult.whales.length > 5 && (
                      <p className="text-phos-mid">…and {scanResult.whales.length - 5} more</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-phos-hi">
                      ◆ +{scanResult.result.discovered} new · ↻{scanResult.result.updated} updated
                    </p>
                    <p>skipped: {scanResult.result.skipped} · {scanResult.result.durationMs}ms</p>
                  </>
                )}
              </div>
            )}
            <Button
              variant="secondary"
              fullWidth
              size="sm"
              disabled={scanner.isPending}
              onClick={async () => {
                setScanResult(null);
                try {
                  const r = await scanner.mutateAsync({ dryRun: false });
                  setScanResult(r);
                  showFeedback("success", `Scanner complete: +${r.result.discovered} new whales`);
                } catch (err) { showFeedback("error", String(err)); }
              }}
            >
              {scanner.isPending ? "⠿ SCANNING…" : "⊛ RUN·SCAN·NOW"}
            </Button>
            <Button
              variant="ghost"
              fullWidth
              size="sm"
              disabled={scanner.isPending}
              onClick={async () => {
                setScanResult(null);
                try {
                  const r = await scanner.mutateAsync({ dryRun: true });
                  setScanResult(r);
                } catch (err) { showFeedback("error", String(err)); }
              }}
            >
              ▸ DRY·RUN·PREVIEW
            </Button>
          </CardBody>
        </Card>

        <div className="text-center text-[9px] text-phos-mid tm-mono pt-2 pb-4">
          tonmirror.sys :: v0.9.4 :: build α
        </div>
      </div>
    </div>
  );
}
