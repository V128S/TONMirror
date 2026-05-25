"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activityKeys } from "./useActivity";
import type { NormalizedQuote } from "@/modules/omniston/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuoteRequestInput = {
  executionId: string;
  soldToken:   string;
  boughtToken: string;
  amountIn:    number;
  slippageBps?: number;
};

export type PrepareRequestInput = {
  executionId:    string;
  quoteId:        string;
  walletAddress?: string;
};

export type PreparedMessage = {
  address:   string;
  amount:    string;
  payload:   string;
  stateInit?: string;
};

export type PreparedTransaction = {
  messages:   PreparedMessage[];
  validUntil: number;
};

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchQuoteAPI(input: QuoteRequestInput): Promise<NormalizedQuote> {
  const res  = await fetch("/api/execution/quote", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      executionId: input.executionId,
      soldToken:   input.soldToken,
      boughtToken: input.boughtToken,
      amountIn:    input.amountIn,
      slippageBps: input.slippageBps ?? 100,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch quote");
  return json.data;
}

async function prepareAPI(input: PrepareRequestInput): Promise<PreparedTransaction> {
  const res  = await fetch("/api/execution/prepare", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({
      executionId:   input.executionId,
      quoteId:       input.quoteId,
      walletAddress: input.walletAddress,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to prepare execution");
  return json.data;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Manages the full quote→prepare flow for one execution.
 * Designed for use inside QuoteCard.
 */
export function useExecutionFlow() {
  const queryClient = useQueryClient();

  const [quote,   setQuote]   = useState<NormalizedQuote | null>(null);
  const [prepared, setPrepared] = useState<PreparedTransaction | null>(null);

  const quoteMutation = useMutation({
    mutationFn: fetchQuoteAPI,
    onSuccess:  (data) => {
      setQuote(data);
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });

  const prepareMutation = useMutation({
    mutationFn: prepareAPI,
    onSuccess:  (data) => {
      setPrepared(data);
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });

  return {
    quote,
    prepared,
    isQuoting:   quoteMutation.isPending,
    isPreparing: prepareMutation.isPending,
    quoteError:  quoteMutation.error?.message ?? null,
    prepareError: prepareMutation.error?.message ?? null,
    getQuote:    (input: QuoteRequestInput)  => quoteMutation.mutateAsync(input),
    prepare:     (input: PrepareRequestInput) => prepareMutation.mutateAsync(input),
    reset: () => {
      setQuote(null);
      setPrepared(null);
      quoteMutation.reset();
      prepareMutation.reset();
    },
  };
}
