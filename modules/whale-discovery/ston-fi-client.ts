/**
 * STON.fi v1 public API client — Stage 1 of whale discovery.
 *
 * Flow:
 *   1. GET /v1/pools?limit=N  →  top pools by 24h volume
 *   2. For each pool address, GET TonAPI events to extract recent swappers
 *      (STON.fi doesn't expose per-pool operations directly)
 *
 * No auth required. Base URL: https://api.ston.fi
 */

import type { WalletCandidate } from "./types";
import { toFriendlyAddress } from "@/lib/ton-address";

const STONFI_BASE = "https://api.ston.fi";

export interface StonFiPool {
  address: string;       // pool contract address (TON user-friendly)
  dex_v:   string;       // "v1" | "v2"
  stats: {
    volume_usd: string;  // string decimal
  };
}

/** Fetch top N pools sorted by 24h volume. */
export async function getTopPools(limit = 10): Promise<StonFiPool[]> {
  const url = `${STONFI_BASE}/v1/pools?limit=${limit}&offset=0`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next:    { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`STON.fi /v1/pools: ${res.status} ${res.statusText}`);
  const json = await res.json() as { pool_list: StonFiPool[] };
  // Sort by volume descending — API may not guarantee order
  return (json.pool_list ?? [])
    .sort((a, b) => {
      const av = parseFloat(a.stats?.volume_usd ?? "0");
      const bv = parseFloat(b.stats?.volume_usd ?? "0");
      return bv - av;
    })
    .slice(0, limit);
}

/**
 * Given a list of pool addresses, build WalletCandidate[] by fetching
 * recent JettonSwap events from TonAPI for each pool.
 *
 * We use TonAPI here because STON.fi's public API doesn't expose
 * per-pool operation history. Passing `tonApiKey` is optional —
 * without it TonAPI enforces 1 req/s, which is fine for a cron job.
 */
export async function getPoolSwappers(
  poolAddresses: string[],
  options: { limit?: number; tonApiKey?: string } = {},
): Promise<WalletCandidate[]> {
  const { limit = 200, tonApiKey } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (tonApiKey) headers["Authorization"] = `Bearer ${tonApiKey}`;

  const volumeByWallet = new Map<string, number>();
  const countByWallet  = new Map<string, number>();

  for (const poolAddr of poolAddresses) {
    try {
      // TonAPI caps the events `limit` at 100 — sending more returns 400.
      // `limit` here is the candidate cap, so clamp the page size separately.
      const pageSize = Math.min(limit, 100);
      const url = `https://tonapi.io/v2/accounts/${poolAddr}/events` +
                  `?limit=${pageSize}&subject_only=false`;
      const res = await fetch(url, { headers });
      if (!res.ok) {
        console.warn(`[ston-fi-client] TonAPI events failed for ${poolAddr}: ${res.status}`);
        continue;
      }
      const json = await res.json() as {
        events: Array<{
          actions: Array<{
            type: string;
            status: string;
            JettonSwap?: {
              user_wallet?: { address: string };
              ton_in?:      string;  // nanotons
              ton_out?:     string;
              amount_in:    string;
              amount_out:   string;
            };
          }>;
        }>;
      };

      for (const event of json.events ?? []) {
        for (const action of event.actions ?? []) {
          if (action.type !== "JettonSwap" || action.status !== "ok") continue;
          const swap      = action.JettonSwap;
          const rawWallet = swap?.user_wallet?.address;
          if (!rawWallet) continue;
          // TonAPI returns raw `0:…` addresses — store the user-friendly form so
          // discovered leaders read cleanly everywhere downstream.
          const wallet = toFriendlyAddress(rawWallet);

          // Rough USD estimate via ton_in (nanotons → TON, ~$2/TON)
          const nanotons = BigInt(swap?.ton_in ?? swap?.ton_out ?? "0");
          const usdEst   = Number(nanotons) / 1e9 * 2; // rough, refined in Stage 2

          volumeByWallet.set(wallet, (volumeByWallet.get(wallet) ?? 0) + usdEst);
          countByWallet.set(wallet,  (countByWallet.get(wallet)  ?? 0) + 1);
        }
      }

      // Respect free-tier rate limit between pool requests
      await sleep(1_100);
    } catch (err) {
      console.warn(`[ston-fi-client] Error processing pool ${poolAddr}:`, err);
    }
  }

  const candidates: WalletCandidate[] = [];
  for (const [address, rawVolumeUsd] of volumeByWallet.entries()) {
    candidates.push({ address, rawVolumeUsd, swapCount: countByWallet.get(address) ?? 0 });
  }

  // Sort by volume desc, return top 200
  return candidates
    .sort((a, b) => b.rawVolumeUsd - a.rawVolumeUsd)
    .slice(0, 200);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
