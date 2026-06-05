/**
 * Resolves a TON→USD rate via the Omniston quote provider when live, with an
 * in-memory cache window and a safe fallback. Never throws into the caller.
 */
import { getQuoteProvider } from "@/modules/omniston";
import type { QuoteProvider } from "@/modules/omniston/types";

const FALLBACK_TON_USD = 3;
const CACHE_WINDOW_MS = 60_000;
const PROBE_AMOUNT_TON = 1;

let cache: { value: number; at: number } | null = null;

export function __resetPricingCacheForTests() { cache = null; }

export async function getTonUsd(opts?: { provider?: QuoteProvider }): Promise<number> {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") return FALLBACK_TON_USD;
  if (cache && Date.now() - cache.at < CACHE_WINDOW_MS) return cache.value;
  try {
    const provider = opts?.provider ?? (await getQuoteProvider());
    const quote = await provider.getQuote({
      soldToken: "TON", boughtToken: "USDT",
      amountInDecimal: PROBE_AMOUNT_TON, slippageBps: 100,
    });
    const rate = quote.rate > 0 ? quote.rate : FALLBACK_TON_USD;
    cache = { value: rate, at: Date.now() };
    return rate;
  } catch {
    return cache?.value ?? FALLBACK_TON_USD;
  }
}
