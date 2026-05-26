"use client";

import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import { useActivity } from "./useActivity";

export interface TonBalanceResult {
  tonRaw: bigint | null;       // nanotons
  tonFormatted: string | null; // "12.45 TON"
  usdFormatted: string | null; // "≈ $36.20"
  source: "live" | "approx" | "none";
  isLoading: boolean;
}

interface TonApiAccount {
  balance: number; // nanotons as number
}

const TON_NANO = 1_000_000_000;

export function useTonBalance(): TonBalanceResult {
  const address = useTonAddress();
  const isConnected = !!address;

  const apiKey =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_TON_API_KEY ?? "")
      : "";
  const hasApiKey = apiKey.length > 0;

  // ── Live balance from tonapi.io ────────────────────────────────────────
  const {
    data: liveData,
    isLoading: liveLoading,
    isError: liveError,
  } = useQuery<TonApiAccount>({
    queryKey: ["ton-balance", address],
    queryFn: async () => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (hasApiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
        headers,
      });
      if (!res.ok) throw new Error(`tonapi ${res.status}`);
      return res.json() as Promise<TonApiAccount>;
    },
    enabled: isConnected && hasApiKey,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── Approx from activity (fallback) ────────────────────────────────────
  const { data: activityData } = useActivity({ limit: 200 });

  if (!isConnected) {
    return {
      tonRaw: null,
      tonFormatted: null,
      usdFormatted: null,
      source: "none",
      isLoading: false,
    };
  }

  // Live path
  if (hasApiKey) {
    if (liveLoading) {
      return {
        tonRaw: null,
        tonFormatted: null,
        usdFormatted: null,
        source: "live",
        isLoading: true,
      };
    }
    if (!liveError && liveData) {
      const nanotons = BigInt(Math.round(liveData.balance));
      const tons = Number(nanotons) / TON_NANO;
      return {
        tonRaw: nanotons,
        tonFormatted: `${tons.toFixed(2)} TON`,
        usdFormatted: null,
        source: "live",
        isLoading: false,
      };
    }
    // Fall through to approx on error
  }

  // Approx from accepted copy trades
  const approxUsd =
    activityData
      ?.filter((e) => e.decision?.outcome === "accepted")
      .reduce((sum, e) => sum + (e.usdEstimate ?? 0), 0) ?? 0;

  return {
    tonRaw: null,
    tonFormatted: null,
    usdFormatted: approxUsd > 0 ? `≈ $${approxUsd.toFixed(2)}` : null,
    source: "approx",
    isLoading: false,
  };
}
