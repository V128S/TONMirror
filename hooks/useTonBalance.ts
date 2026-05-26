"use client";

import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import { z } from "zod";
import { useActivity } from "./useActivity";

export interface TonBalanceResult {
  tonRaw: bigint | null;       // nanotons
  tonFormatted: string | null; // "12.45 TON"
  usdFormatted: string | null; // "≈ $36.20 traded"
  source: "live" | "approx" | "none";
  isLoading: boolean;
}

const BalanceResponseSchema = z.object({
  balance: z.string(),
});

const TON_NANO = BigInt(1_000_000_000);

function parseNanotons(raw: string): bigint {
  try { return BigInt(raw); } catch { return BigInt(0); }
}

export function useTonBalance(): TonBalanceResult {
  const address     = useTonAddress();
  const isConnected = !!address;

  // ── Live balance via server-side proxy (avoids CORS, hides API key) ─────
  const { data: liveData, isLoading: liveLoading, isError: liveError } = useQuery({
    queryKey: ["ton-balance", address],
    queryFn: async ({ signal }) => {
      const res = await fetch(
        `/api/ton/balance?address=${encodeURIComponent(address!)}`,
        { signal },
      );
      if (!res.ok) throw new Error(`balance ${res.status}`);
      const json: unknown = await res.json();
      return BalanceResponseSchema.parse(json);
    },
    enabled:         isConnected,
    staleTime:       30_000,
    refetchInterval: 60_000,
    retry:           1,
  });

  // ── Fallback: sum from accepted copy trades ─────────────────────────────
  const { data: activityData } = useActivity({ limit: 200 });

  if (!isConnected) {
    return { tonRaw: null, tonFormatted: null, usdFormatted: null, source: "none", isLoading: false };
  }

  if (liveLoading) {
    return { tonRaw: null, tonFormatted: null, usdFormatted: null, source: "live", isLoading: true };
  }

  if (!liveError && liveData) {
    const nanotons = parseNanotons(liveData.balance);
    const tons     = Number(nanotons * BigInt(100) / TON_NANO) / 100;
    return {
      tonRaw:       nanotons,
      tonFormatted: `${tons.toFixed(2)} TON`,
      usdFormatted: null,
      source:       "live",
      isLoading:    false,
    };
  }

  // Fallback — cumulative copy-trade volume (not a real wallet balance)
  const approxUsd =
    activityData
      ?.filter((e) => e.decision?.outcome === "accepted")
      .reduce((sum, e) => sum + (e.usdEstimate ?? 0), 0) ?? 0;

  return {
    tonRaw:       null,
    tonFormatted: null,
    usdFormatted: approxUsd > 0 ? `≈ $${approxUsd.toFixed(2)} traded` : null,
    source:       "approx",
    isLoading:    false,
  };
}
