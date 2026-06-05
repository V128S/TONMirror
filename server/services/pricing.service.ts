/**
 * Resolves token→USD rates via the Omniston quote provider when live, with a
 * per-token in-memory cache window and a safe fallback. Never throws into the
 * caller.
 *
 * Supports the live token universe (TON, USDT, tsTON). USDT is pinned to $1;
 * TON and tsTON are priced with a 1-unit probe quote into USDT.
 */
import { getQuoteProvider } from "@/modules/omniston";
import type { QuoteProvider } from "@/modules/omniston/types";

const FALLBACK_TON_USD = 3;
const CACHE_WINDOW_MS = 60_000;
const PROBE_AMOUNT = 1;

/** Per-token cache: canonical symbol → { value, at } */
const cache = new Map<string, { value: number; at: number }>();

export function __resetPricingCacheForTests() { cache.clear(); }

/**
 * USD price of one unit of `token`.
 *
 * - USDT  → 1 (stablecoin, no network call)
 * - TON   → live TON→USDT probe (fallback 3)
 * - tsTON → live tsTON→USDT probe (fallback 3, ~TON price)
 *
 * Returns the fallback when the live source is disabled or the probe fails.
 */
export async function getTokenUsd(
  token: string,
  opts?: { provider?: QuoteProvider },
): Promise<number> {
  const symbol = token.trim().toUpperCase();

  // Stablecoin — always $1, no probe needed even in demo.
  if (symbol === "USDT") return 1;

  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") return FALLBACK_TON_USD;

  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.at < CACHE_WINDOW_MS) return cached.value;

  try {
    const provider = opts?.provider ?? (await getQuoteProvider());
    const quote = await provider.getQuote({
      soldToken: symbol, boughtToken: "USDT",
      amountInDecimal: PROBE_AMOUNT, slippageBps: 100,
    });
    const rate = quote.rate > 0 ? quote.rate : FALLBACK_TON_USD;
    cache.set(symbol, { value: rate, at: Date.now() });
    return rate;
  } catch {
    return cache.get(symbol)?.value ?? FALLBACK_TON_USD;
  }
}

/** Back-compat alias — TON→USD. */
export async function getTonUsd(opts?: { provider?: QuoteProvider }): Promise<number> {
  return getTokenUsd("TON", opts);
}

/**
 * Convert a USD-denominated amount into decimal units of `token`.
 *
 * This is the bridge between strategy sizing (always USD) and the Omniston
 * quote (which expects the sold-token's own decimal amount). USDT is identity;
 * TON/tsTON divide by their live USD price.
 */
export async function usdToTokenAmount(
  usdAmount: number,
  token: string,
  opts?: { provider?: QuoteProvider },
): Promise<number> {
  if (token.trim().toUpperCase() === "USDT") return usdAmount;
  const price = await getTokenUsd(token, opts);
  if (!Number.isFinite(price) || price <= 0) return usdAmount;
  return usdAmount / price;
}
