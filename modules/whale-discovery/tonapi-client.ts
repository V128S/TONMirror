/**
 * TonAPI v2 client — Stage 2 of whale discovery.
 *
 * For each candidate wallet, fetches up to 100 recent events,
 * extracts JettonSwap actions, and returns normalised SwapEvent[].
 *
 * Rate limiting: 1100ms between calls on free tier (1 req/s).
 * With tonApiKey, limit increases but we keep the delay to be safe.
 */

import type { SwapEvent } from "./types";

const TONAPI_BASE    = "https://tonapi.io";
const DELAY_MS       = 1_100; // free tier: 1 req/s
const ROUGH_TON_USD  = 2;     // conservative TON price estimate for scoring

/** Fetches last N events for a wallet and returns JettonSwap ones. */
export async function getWalletSwaps(
  address:   string,
  options:   { limit?: number; tonApiKey?: string } = {},
): Promise<SwapEvent[]> {
  const { limit = 100, tonApiKey } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (tonApiKey) headers["Authorization"] = `Bearer ${tonApiKey}`;

  const url = `${TONAPI_BASE}/v2/accounts/${address}/events` +
              `?limit=${limit}&subject_only=true&initiator=true`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    if (res.status === 429) throw new RateLimitError(`TonAPI 429 for ${address}`);
    throw new Error(`TonAPI events ${res.status} for ${address}`);
  }

  const json = await res.json() as {
    events: Array<{
      timestamp: number;  // unix seconds
      actions:   Array<{
        type:   string;
        status: string;
        JettonSwap?: {
          dex:              string;
          ton_in?:          string; // nanotons
          ton_out?:         string;
          amount_in:        string;
          amount_out:       string;
          jetton_master_in?:  { symbol?: string; name?: string };
          jetton_master_out?: { symbol?: string; name?: string };
        };
      }>;
    }>;
  };

  const swaps: SwapEvent[] = [];

  for (const event of json.events ?? []) {
    const ts = new Date(event.timestamp * 1_000);
    for (const action of event.actions ?? []) {
      if (action.type !== "JettonSwap" || action.status !== "ok") continue;
      const s = action.JettonSwap!;

      const tonInNano  = BigInt(s.ton_in  ?? "0");
      const tonOutNano = BigInt(s.ton_out ?? "0");

      const usdIn    = tonInNano  > BigInt(0) ? Number(tonInNano)  / 1e9 * ROUGH_TON_USD : 0;
      const usdOut   = tonOutNano > BigInt(0) ? Number(tonOutNano) / 1e9 * ROUGH_TON_USD : 0;

      const soldToken   = s.ton_in ? "TON" : (s.jetton_master_in?.symbol  ?? "UNKNOWN");
      const boughtToken = s.ton_out ? "TON" : (s.jetton_master_out?.symbol ?? "UNKNOWN");

      swaps.push({
        txHash:      `${address}_${event.timestamp}`,
        timestamp:   ts,
        soldToken,
        boughtToken,
        usdIn,
        usdOut,
        dex:         s.dex ?? "ston.fi",
      });
    }
  }

  return swaps;
}

/**
 * Fetch swaps for multiple wallets with rate-limit delay between calls.
 * Returns a Map<address, SwapEvent[]>.
 */
export async function batchGetWalletSwaps(
  addresses:  string[],
  options:    { limit?: number; tonApiKey?: string } = {},
): Promise<Map<string, SwapEvent[]>> {
  const results = new Map<string, SwapEvent[]>();

  for (const address of addresses) {
    try {
      const swaps = await getWalletSwaps(address, options);
      results.set(address, swaps);
    } catch (err) {
      if (err instanceof RateLimitError) {
        console.warn(`[tonapi-client] Rate limited, waiting 5s…`);
        await sleep(5_000);
        // Retry once
        try {
          results.set(address, await getWalletSwaps(address, options));
        } catch {
          console.warn(`[tonapi-client] Skipping ${address} after retry`);
          results.set(address, []);
        }
      } else {
        console.warn(`[tonapi-client] Failed for ${address}:`, err);
        results.set(address, []);
      }
    }
    await sleep(DELAY_MS);
  }

  return results;
}

export class RateLimitError extends Error {}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
