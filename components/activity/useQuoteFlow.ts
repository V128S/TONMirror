"use client";

import { useEffect, useState } from "react";
import { useExecutionFlow } from "@/hooks/useExecution";
import { useWallet, useWalletActions } from "@/hooks/useWallet";
import { isLiveSource } from "@/lib/env";

export interface QuoteFlowParams {
  executionId:   string;
  soldToken:     string;
  boughtToken:   string;
  plannedAmount: number;
  slippageBps?:  number;
}

export type QuoteStep = "idle" | "quoted" | "prepared" | "submitted";

/**
 * Encapsulates the quote → prepare → sign → submit execution flow so it can be
 * rendered by either the terminal or the glass presentation of the confirm
 * sheet. Holds no theme/markup concerns — only state and handlers.
 */
export function useQuoteFlow({
  executionId,
  soldToken,
  boughtToken,
  plannedAmount,
  slippageBps = 100,
}: QuoteFlowParams) {
  const flow    = useExecutionFlow();
  const wallet  = useWallet();
  const actions = useWalletActions();
  const [step, setStep]           = useState<QuoteStep>("idle");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  // User-editable copy size (USD); defaults to the strategy's planned amount.
  const [amount, setAmount]       = useState<number>(plannedAmount);

  useEffect(() => {
    if (step !== "idle") return;
    flow
      .getQuote({ executionId, soldToken, boughtToken, amountIn: plannedAmount, slippageBps })
      .then(() => setStep("quoted"))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Re-fetch the quote for a new (USD) amount — used by the editable amount field. */
  const requote = (nextAmount: number) => {
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) return;
    setAmount(nextAmount);
    flow.reset();
    setStep("idle");
    flow
      .getQuote({ executionId, soldToken, boughtToken, amountIn: nextAmount, slippageBps })
      .then(() => setStep("quoted"))
      .catch(() => {});
  };

  const handleConfirm = async () => {
    if (!flow.quote) return;

    // Omniston RFQ quotes are short-lived (~30s). On the live path the quote the
    // user is looking at may already be stale by the time they tap confirm, so
    // re-quote right before building the tx and prepare with the fresh quoteId.
    let quoteId = flow.quote.quoteId;
    if (isLiveSource) {
      const fresh = await flow.getQuote({
        executionId, soldToken, boughtToken, amountIn: amount, slippageBps,
      });
      quoteId = fresh.quoteId;
    }

    await flow.prepare({
      executionId,
      quoteId,
      walletAddress: wallet.address ?? undefined,
    });
    setStep("prepared");
  };

  const handleRefresh = () => {
    flow.reset();
    setStep("idle");
    flow
      .getQuote({ executionId, soldToken, boughtToken, amountIn: amount, slippageBps })
      .then(() => setStep("quoted"))
      .catch(() => {});
  };

  /**
   * Real TON Connect send flow: sendTransaction() opens the wallet for signing
   * and broadcasts; then POST /api/execution/submit records the signed BoC.
   */
  const handleSend = async () => {
    if (!flow.prepared) return;
    setIsSending(true);
    setSendError(null);
    try {
      const result = await actions.sendTransaction({
        messages:   flow.prepared.messages,
        validUntil: flow.prepared.validUntil,
      });
      await flow.submit({ executionId, boc: result.boc });
      setStep("submitted");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction rejected or failed";
      setSendError(msg);
    } finally {
      setIsSending(false);
    }
  };

  const expiresAt = flow.quote
    ? typeof flow.quote.expiresAt === "string"
      ? new Date(flow.quote.expiresAt)
      : flow.quote.expiresAt
    : null;
  const isExpired = expiresAt ? Date.now() > expiresAt.getTime() : false;

  return {
    flow, wallet, actions,
    step, isSending, sendError,
    amount, requote,
    handleConfirm, handleRefresh, handleSend,
    isExpired,
  };
}
