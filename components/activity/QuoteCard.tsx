"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount, formatUsd, formatBps } from "@/lib/format";
import { useExecutionFlow } from "@/hooks/useExecution";
import { useWallet, useWalletActions } from "@/hooks/useWallet";
import { cn } from "@/lib/utils";
import type { NormalizedQuote } from "@/modules/omniston/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuoteCardProps {
  executionId:  string;
  soldToken:    string;
  boughtToken:  string;
  /** Planned amount in USD (copy strategy output) */
  plannedAmount: number;
  slippageBps?:  number;
  onDismiss:     () => void;
}

// ─── Countdown ────────────────────────────────────────────────────────────────

function useCountdown(expiresAt: Date | null): number {
  const [secsLeft, setSecsLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () =>
      setSecsLeft(Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return secsLeft;
}

// ─── Inner views ──────────────────────────────────────────────────────────────

function QuoteDetails({
  quote,
  onConfirm,
  onRefresh,
  isPreparing,
  isExpired,
}: {
  quote:      NormalizedQuote;
  onConfirm:  () => void;
  onRefresh:  () => void;
  isPreparing: boolean;
  isExpired:  boolean;
}) {
  const expiresAt  = typeof quote.expiresAt === "string"
    ? new Date(quote.expiresAt)
    : quote.expiresAt;
  const secsLeft   = useCountdown(isExpired ? null : expiresAt);

  return (
    <div className="space-y-3">
      {/* Token swap visual */}
      <div className="flex items-center gap-2 bg-surface-3 rounded-2xl px-4 py-3">
        <div className="flex-1 text-center">
          <p className="text-xs text-text-muted">You sell</p>
          <p className="text-lg font-bold text-text-primary mt-0.5">
            {formatAmount(quote.amountInDecimal)}
          </p>
          <p className="text-sm text-text-secondary">{quote.soldToken}</p>
        </div>
        <span className="text-2xl text-text-muted">→</span>
        <div className="flex-1 text-center">
          <p className="text-xs text-text-muted">You receive</p>
          <p className="text-lg font-bold text-success mt-0.5">
            {formatAmount(quote.amountOutDecimal)}
          </p>
          <p className="text-sm text-text-secondary">{quote.boughtToken}</p>
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface-2 rounded-xl px-3 py-2">
          <p className="text-text-muted">Rate</p>
          <p className="text-text-primary font-medium mt-0.5">
            1 {quote.soldToken} = {formatAmount(quote.rate)} {quote.boughtToken}
          </p>
        </div>
        <div className="bg-surface-2 rounded-xl px-3 py-2">
          <p className="text-text-muted">Slippage</p>
          <p className="text-text-primary font-medium mt-0.5">
            {formatBps(quote.slippageBps)}
          </p>
        </div>
        <div className="bg-surface-2 rounded-xl px-3 py-2">
          <p className="text-text-muted">Route</p>
          <p className="text-text-primary font-medium mt-0.5 truncate">
            {quote.routeSummary}
          </p>
        </div>
        <div className="bg-surface-2 rounded-xl px-3 py-2">
          <p className="text-text-muted">Resolver</p>
          <p className="text-text-primary font-medium mt-0.5 truncate">
            {quote.resolverName}
          </p>
        </div>
      </div>

      {/* Expiry + source */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>
          {!quote.isLive && (
            <Badge variant="warning" className="mr-1.5">Demo</Badge>
          )}
          {isExpired ? (
            <span className="text-danger">Expired</span>
          ) : (
            <span>Expires in {secsLeft}s</span>
          )}
        </span>
        <span className="text-text-muted">Quote ID: {quote.quoteId.slice(-8)}</span>
      </div>

      {/* Actions */}
      {isExpired ? (
        <Button variant="secondary" fullWidth size="md" onClick={onRefresh}>
          🔄 Refresh Quote
        </Button>
      ) : (
        <Button
          variant="primary"
          fullWidth
          size="md"
          isLoading={isPreparing}
          onClick={onConfirm}
        >
          Confirm Quote →
        </Button>
      )}
    </div>
  );
}

function PreparedView({
  messages,
  validUntil,
  onSend,
  isConnected,
  onConnect,
}: {
  messages:    { address: string; amount: string; payload: string; stateInit?: string }[];
  validUntil:  number;
  onSend:      () => void;
  isConnected: boolean;
  onConnect:   () => void;
}) {
  const secsLeft = useCountdown(new Date(validUntil * 1000));

  return (
    <div className="space-y-3">
      <div className="bg-surface-3 rounded-2xl px-4 py-3 space-y-1.5">
        <p className="text-xs text-text-muted">Transaction ready</p>
        <p className="text-sm text-text-primary font-medium">
          {messages.length} message{messages.length > 1 ? "s" : ""} to sign
        </p>
        <p className="text-xs text-text-muted">Valid for {secsLeft}s</p>
      </div>

      {isConnected ? (
        <Button variant="primary" fullWidth size="md" onClick={onSend}>
          Sign &amp; Send with TON Connect
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text-muted text-center">
            Connect your wallet to sign the transaction
          </p>
          <Button variant="secondary" fullWidth size="md" onClick={onConnect}>
            Connect Wallet
          </Button>
        </div>
      )}

      <p className="text-[10px] text-text-muted text-center">
        ⚠️ On-chain broadcast is stubbed in this demo. Signing will not actually send.
      </p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function QuoteCard({
  executionId,
  soldToken,
  boughtToken,
  plannedAmount,
  slippageBps = 100,
  onDismiss,
}: QuoteCardProps) {
  const flow     = useExecutionFlow();
  const wallet   = useWallet();
  const actions  = useWalletActions();
  const [step, setStep] = useState<"idle" | "quoted" | "prepared">("idle");

  // Auto-fetch quote on mount
  useEffect(() => {
    if (step !== "idle") return;
    flow.getQuote({
      executionId,
      soldToken,
      boughtToken,
      amountIn:    plannedAmount,
      slippageBps,
    }).then(() => setStep("quoted")).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    if (!flow.quote) return;
    await flow.prepare({
      executionId,
      quoteId:       flow.quote.quoteId,
      walletAddress: wallet.address ?? undefined,
    });
    setStep("prepared");
  };

  const handleRefresh = () => {
    flow.reset();
    setStep("idle");
    flow.getQuote({
      executionId,
      soldToken,
      boughtToken,
      amountIn:    plannedAmount,
      slippageBps,
    }).then(() => setStep("quoted")).catch(() => {});
  };

  const handleSend = () => {
    // Stub — will be wired in Phase 4
    alert("TON Connect signing is stubbed in this demo. Phase 4 will broadcast the transaction.");
  };

  const expiresAt = flow.quote
    ? (typeof flow.quote.expiresAt === "string"
        ? new Date(flow.quote.expiresAt)
        : flow.quote.expiresAt)
    : null;
  const isExpired = expiresAt ? Date.now() > expiresAt.getTime() : false;

  return (
    <Card elevated className="mt-2">
      <CardHeader className="mb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          Quote · {soldToken} → {boughtToken}
        </CardTitle>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary text-lg leading-none"
        >
          ✕
        </button>
      </CardHeader>
      <CardBody>
        {/* Loading */}
        {flow.isQuoting && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-surface-3 rounded-2xl px-4 py-3">
              <div className="flex-1 text-center space-y-1.5">
                <Skeleton className="w-16 h-4 mx-auto" />
                <Skeleton className="w-20 h-7 mx-auto" />
              </div>
              <span className="text-2xl text-text-muted">→</span>
              <div className="flex-1 text-center space-y-1.5">
                <Skeleton className="w-16 h-4 mx-auto" />
                <Skeleton className="w-20 h-7 mx-auto" />
              </div>
            </div>
            <p className="text-xs text-text-muted text-center">Fetching best quote…</p>
          </div>
        )}

        {/* Error */}
        {!flow.isQuoting && (flow.quoteError || flow.prepareError) && (
          <div className="space-y-3">
            <div className="bg-red-500/10 text-red-400 rounded-xl px-3 py-2 text-sm">
              {flow.quoteError ?? flow.prepareError}
            </div>
            <Button variant="secondary" fullWidth size="sm" onClick={handleRefresh}>
              Try Again
            </Button>
          </div>
        )}

        {/* Quoted */}
        {step === "quoted" && flow.quote && !flow.isQuoting && !flow.quoteError && (
          <QuoteDetails
            quote={flow.quote}
            onConfirm={handleConfirm}
            onRefresh={handleRefresh}
            isPreparing={flow.isPreparing}
            isExpired={isExpired}
          />
        )}

        {/* Prepared */}
        {step === "prepared" && flow.prepared && (
          <PreparedView
            messages={flow.prepared.messages}
            validUntil={flow.prepared.validUntil}
            onSend={handleSend}
            isConnected={wallet.isConnected}
            onConnect={actions.connect}
          />
        )}
      </CardBody>
    </Card>
  );
}
