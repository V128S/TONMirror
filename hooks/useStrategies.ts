"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Strategy {
  id:                   string;
  userId:               string;
  leaderWalletId:       string;
  mode:                 "fixed_amount" | "percent_of_leader";
  fixedAmount:          number | null;
  percentOfLeader:      number | null;
  maxTradeSize:         number | null;
  slippageBps:          number;
  allowedTokens:        string[];
  blockedTokens:        string[];
  copySells:            boolean;
  dailyMaxSpend:        number | null;
  requireManualConfirm: boolean;
  isPaused:             boolean;
  createdAt:            string;
  leaderWallet: {
    id:            string;
    nickname:      string;
    address:       string;
    riskScore:     number;
    activityScore: number;
    winRateApprox: number;
  };
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const strategyKeys = {
  all:  ["strategies"] as const,
  list: (userId?: string) => ["strategies", "list", userId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useStrategies(telegramId = "demo_12345") {
  return useQuery<Strategy[]>({
    queryKey: strategyKeys.list(telegramId),
    queryFn:  async () => {
      const res = await fetch(`/api/strategies?telegramId=${telegramId}`);
      if (!res.ok) throw new Error("Failed to load strategies");
      const json = await res.json();
      return json.data;
    },
  });
}

export function usePauseStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPaused }: { id: string; isPaused: boolean }) => {
      const res = await fetch(`/api/strategies/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isPaused }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to update strategy");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyKeys.all });
    },
  });
}

export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/strategies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete strategy");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strategyKeys.all });
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
    },
  });
}
