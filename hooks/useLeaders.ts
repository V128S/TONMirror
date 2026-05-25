"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Leader {
  id:            string;
  nickname:      string;
  address:       string;
  tags:          string[];
  riskScore:     number;
  activityScore: number;
  winRateApprox: number;
  notes:         string | null;
  isActive:      boolean;
  isFollowing:   boolean;
  createdAt:     string;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const leaderKeys = {
  all:    ["leaders"] as const,
  list:   (userId?: string) => ["leaders", "list", userId] as const,
  detail: (id: string)      => ["leaders", id] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLeaders(userId = "demo_12345") {
  return useQuery<Leader[]>({
    queryKey: leaderKeys.list(userId),
    queryFn:  async () => {
      const res = await fetch(`/api/leaders?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load leaders");
      const json = await res.json();
      return json.data;
    },
  });
}

export function useLeader(id: string) {
  return useQuery<Leader>({
    queryKey: leaderKeys.detail(id),
    queryFn:  async () => {
      const res = await fetch(`/api/leaders/${id}`);
      if (!res.ok) throw new Error("Failed to load leader");
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });
}

export function useFollowLeader() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      leaderWalletId:       string;
      telegramId?:          string;
      mode?:                "fixed_amount" | "percent_of_leader";
      fixedAmount?:         number;
      requireManualConfirm?: boolean;
    }) => {
      const res = await fetch("/api/strategies", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          leaderWalletId:       input.leaderWalletId,
          telegramId:           input.telegramId ?? "demo_12345",
          mode:                 input.mode ?? "fixed_amount",
          fixedAmount:          input.fixedAmount ?? 10,
          requireManualConfirm: input.requireManualConfirm ?? true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to follow leader");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaderKeys.all });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}
