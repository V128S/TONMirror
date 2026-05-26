"use client";

import { useQuery } from "@tanstack/react-query";
import { useTonAddress } from "@tonconnect/ui-react";
import { z } from "zod";
import { useActivity } from "./useActivity";

export interface TonBalanceResult {
  tonRaw: bigint | null;       // nanotons
  tonFormatted: string | null; // "12.45 TON"
  usdFormatted: string | null; // "≈ $36.20"
  source: "live" | "approx" | "none";
  isLoading: boolean;
}

/** tonapi.io /v2/accounts returns balance as a string (nanotons) */
const TonApiAccountSchema = z.object({
  balance: z.union([z.string(), z.number()]),
});

const TON_NANO = BigInt(1_000_000_000);

/** Parse tonapi balance safely — handles both string and number forms,
 *  avoids Number precision loss for large balances. */
function parseNanotons(raw: string | number): bigint {
  if (typeof raw === "string") return BigInt(raw);
  // Use string conversion to avoid floating-point truncation
  return BigInt(Math.trunc(raw).toString());
}

const apiKey = process.env.NEXT_PUBLIC_TON_API_KEY ?? "";
const hasApiKey = apiKey.length > 0;

export function useTonBalance(): TonBalanceResult {
  const address    = useTonAddress();
  const isConnected = !!address;

  // ── Live balance from tonapi.io ────────────────────────────────────────
  const {
    data: liveData,
    isLoading: liveLoading,
    isError: liveError,
  } = useQuery({
    queryKey: ["ton-balance", address],
    queryFn: async ({ signal }) => {
      const headers: Record<string, string> = { Accept: "application/json" };
      if (hasApiKey) headers["Authorization"] = `Bearer ${apiKey}`;
      const res = await fetch(`https://tonapi.io/v2/accounts/${address}`, {
        headers,
        signal,
      });
      if (!res.ok) throw new Error(`tonapi ${res.status}`);
      const json: unknown = await res.json();
      return TonApiAccountSchema.parse(json);
    },
    enabled: isConnected && hasApiKey,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── Approx from activity (fallback) ────────────────────────────────────
  const { data: activityData } = useActivity({ limit: 200 });

  if (!isConnected) {
    return { tonRaw: null, tonFormatted: null, usdFormatted: null, source: "none", isLoading: false };
  }

  // Live path
  if (hasApiKey) {
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
    // Fall through to approx on API error
  }

  // Cumulative volume of accepted copy trades (not a real balance — labelled accordingly in UI)
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
