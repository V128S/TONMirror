"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authHeaders } from "@/lib/telegram-init";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActivityEvent {
  id:                  string;
  externalId:          string;
  timestamp:           string;
  txHash:              string;
  soldToken:           string;
  boughtToken:         string;
  soldAmountDecimal:   number;
  boughtAmountDecimal: number;
  usdEstimate:         number | null;
  dex:                 string;
  sourceProvider:      string;
  leader: {
    id:       string;
    nickname: string;
    address:  string;
  };
  decision: {
    id:                   string;
    outcome:              "accepted" | "rejected" | "manual_review";
    reason:               string;
    riskFlags:            string[];
    plannedAmountDecimal: number | null;
  } | null;
  execution: {
    id:          string;
    status:      string;
    estimatedOut: number | null;
    txHash:      string | null;
  } | null;
}

// ─── Query keys ───────────────────────────────────────────────────────────────

export const activityKeys = {
  all:  ["activity"] as const,
  list: (leaderId?: string) => ["activity", "list", leaderId] as const,
};

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useActivity(options?: { leaderId?: string; limit?: number }) {
  const { leaderId, limit = 30 } = options ?? {};

  return useQuery<ActivityEvent[]>({
    queryKey: activityKeys.list(leaderId),
    queryFn:  async () => {
      const params = new URLSearchParams();
      if (leaderId) params.set("leaderId", leaderId);
      params.set("limit", String(limit));
      // Send initData so the server scopes the feed to this user's own copies.
      const res = await fetch(`/api/activity?${params}`, { headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to load activity");
      const json = await res.json();
      return json.data;
    },
    refetchInterval: 10_000, // poll every 10 s for live updates
  });
}

// ─── Demo mutations ───────────────────────────────────────────────────────────

export type DemoTradeType = "profitable" | "risky" | "blocked_token";

export function useEmitDemoTrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (type: DemoTradeType) => {
      const res = await fetch("/api/demo/trade", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to emit trade");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useResetDemoData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/demo/seed", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    "{}",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to reset demo data");
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaders"] });
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
