"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Types (mirror server/services/whale-activity.service.ts) ───────────────────

export type WhalePeriod = "day" | "week" | "month";
export type WhaleTradeDirection = "buy" | "sell" | "swap";

export interface WhaleTrade {
  id:                  string;
  txHash:              string;
  timestamp:           string;
  soldToken:           string;
  boughtToken:         string;
  soldAmountDecimal:   number;
  boughtAmountDecimal: number;
  usdEstimate:         number | null;
  dex:                 string;
  direction:           WhaleTradeDirection;
}

export interface WhaleActivityStats {
  tradeCount:   number;
  volumeUsd:    number;
  avgSizeUsd:   number | null;
  buys:         number;
  sells:        number;
  lastActiveAt: string | null;
}

export interface WhaleActivity {
  period: WhalePeriod;
  trades: WhaleTrade[];
  stats:  WhaleActivityStats;
}

// ─── Query keys ─────────────────────────────────────────────────────────────

export const leaderTradeKeys = {
  all:    ["leader-trades"] as const,
  detail: (id: string, period: WhalePeriod) => ["leader-trades", id, period] as const,
};

// ─── Hook ───────────────────────────────────────────────────────────────────

/** A whale's recent on-chain swaps + aggregate stats for the given period. */
export function useLeaderTrades(id: string, period: WhalePeriod) {
  return useQuery<WhaleActivity>({
    queryKey: leaderTradeKeys.detail(id, period),
    queryFn:  async () => {
      const res = await fetch(`/api/leaders/${id}/trades?period=${period}`);
      if (!res.ok) throw new Error("Failed to load whale activity");
      const json = await res.json();
      return json.data;
    },
    enabled:   !!id,
    staleTime: 30_000,
  });
}
