/**
 * TonWebhookTradeSource — live trade source driven by push webhooks.
 *
 * Architecture notes
 * ──────────────────
 * Unlike a polling source, this class is stateless between requests.
 * Webhooks are delivered to POST /api/webhooks/ton by the TON indexer,
 * which calls `processIncoming()` on each validated payload.
 *
 * `start/stop/subscribeToWallet/unsubscribeFromWallet` manage a watched-
 * address registry that the webhook route can query to decide whether an
 * incoming event is for a tracked wallet.
 *
 * `getRecentTrades` is a real TonAPI v2 implementation — it queries
 * `/v2/accounts/{address}/events` (using TON_API_KEY when set) and normalizes
 * DEX swap actions into NormalizedTradeEvent rows.
 *
 * Enabled only when NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 * When disabled the webhook route returns 403 before ever touching this class.
 */

import type { LeaderTradeSource, NormalizedTradeEvent, TradeEventHandler } from "./types";
import { parseTonWebhookPayload } from "./ton-payload-parser";
import { fetchWithRetry } from "@/lib/fetch-retry";

export class TonWebhookTradeSource implements LeaderTradeSource {
  /** Addresses currently being watched: address → leaderWalletId */
  private readonly watchedWallets = new Map<string, string>();
  private readonly handlers: TradeEventHandler[] = [];
  private running = false;

  // ── LeaderTradeSource ──────────────────────────────────────────────────────

  async start(): Promise<void> {
    this.running = true;
    // Nothing to initialise for a push-based source.
    // A polling source would start an interval here.
  }

  async stop(): Promise<void> {
    this.running = false;
    this.watchedWallets.clear();
    this.handlers.length = 0;
  }

  async subscribeToWallet(address: string, leaderWalletId?: string): Promise<void> {
    this.watchedWallets.set(address, leaderWalletId ?? address);
  }

  async unsubscribeFromWallet(address: string): Promise<void> {
    this.watchedWallets.delete(address);
  }

  /**
   * Fetches recent JettonSwap trades for a wallet from TonAPI v2.
   *
   * Calls GET /v2/accounts/{address}/events?limit=20&subject_only=true
   * and normalises JettonSwap actions into NormalizedTradeEvent[].
   *
   * Falls back to [] on any network/parse error so callers never crash.
   */
  async getRecentTrades(address: string): Promise<NormalizedTradeEvent[]> {
    const leaderWalletId = this.watchedWallets.get(address) ?? address;

    try {
      const apiKey = process.env.TON_API_KEY ?? "";
      const headers: Record<string, string> = { Accept: "application/json" };
      if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

      // Live TON/USD rate (cached) for USD estimates — feeds the daily-spend cap.
      const tonUsd = await getTonUsdRate(apiKey);

      const url =
        `https://tonapi.io/v2/accounts/${encodeURIComponent(address)}/events` +
        `?limit=20&subject_only=true&initiator=true`;

      const res = await fetchWithRetry(url, { headers });
      if (!res.ok) {
        console.warn(`[TonWebhookTradeSource] TonAPI ${res.status} for ${address}`);
        return [];
      }

      const json = (await res.json()) as {
        events: Array<{
          event_id: string;
          timestamp: number;
          actions: Array<{
            type:   string;
            status: string;
            JettonSwap?: {
              dex:               string;
              ton_in?:           string;
              ton_out?:          string;
              amount_in:         string;
              amount_out:        string;
              jetton_master_in?:  { symbol?: string; decimals?: number };
              jetton_master_out?: { symbol?: string; decimals?: number };
            };
          }>;
        }>;
      };

      const events: NormalizedTradeEvent[] = [];

      for (const event of json.events ?? []) {
        for (const action of event.actions ?? []) {
          if (action.type !== "JettonSwap" || action.status !== "ok") continue;
          const s = action.JettonSwap!;

          // Determine tokens and amounts
          const isTonIn    = Boolean(s.ton_in && BigInt(s.ton_in) > BigInt(0));
          const isTonOut   = Boolean(s.ton_out && BigInt(s.ton_out) > BigInt(0));

          const soldToken   = isTonIn  ? "TON" : (s.jetton_master_in?.symbol  ?? "UNKNOWN");
          const boughtToken = isTonOut ? "TON" : (s.jetton_master_out?.symbol ?? "UNKNOWN");

          // Resolve decimal amounts
          const NANO = BigInt(1_000_000_000);
          const soldDecimalsVal  = s.jetton_master_in?.decimals  ?? 9;
          const boughtDecimalsVal = s.jetton_master_out?.decimals ?? 9;

          const soldAmountDecimal = isTonIn
            ? Number(BigInt(s.ton_in!)  * BigInt(1000) / NANO) / 1000
            : Number(BigInt(s.amount_in))  / Math.pow(10, soldDecimalsVal);

          const boughtAmountDecimal = isTonOut
            ? Number(BigInt(s.ton_out!) * BigInt(1000) / NANO) / 1000
            : Number(BigInt(s.amount_out)) / Math.pow(10, boughtDecimalsVal);

          // USD estimate from the live TON/USD rate, using the TON leg of the
          // swap. Jetton-to-jetton swaps (no TON leg) stay undefined.
          const usdEstimate = isTonIn
            ? soldAmountDecimal * tonUsd
            : isTonOut
              ? boughtAmountDecimal * tonUsd
              : undefined;

          const externalId = `${address}_${event.event_id}_${soldToken}_${boughtToken}`;

          events.push({
            id:                  externalId,
            externalId,
            leaderWalletId,
            leaderAddress:       address,
            txHash:              event.event_id,
            timestamp:           new Date(event.timestamp * 1_000),
            soldToken,
            boughtToken,
            soldAmountDecimal,
            boughtAmountDecimal,
            usdEstimate,
            dex:                 s.dex ?? "ston.fi",
            sourceProvider:      "ton_webhook",
            rawSourceJson:       { event_id: event.event_id, action: s },
          });
        }
      }

      return events;
    } catch (err) {
      console.warn("[TonWebhookTradeSource] getRecentTrades failed:", err);
      return [];
    }
  }

  onTrade(handler: TradeEventHandler): void {
    this.handlers.push(handler);
  }

  // ── Webhook entry point ───────────────────────────────────────────────────

  /**
   * Called by the webhook route for every validated incoming payload.
   *
   * 1. Checks that the event's account address is in watchedWallets.
   * 2. Parses & normalises the payload.
   * 3. Fans out to all registered handlers.
   *
   * Returns the normalised event (for logging / response), or null if the
   * payload is not actionable (not a swap, unknown wallet, parse error).
   */
  async processIncoming(raw: unknown): Promise<NormalizedTradeEvent | null> {
    // Basic type guard before doing the heavier Zod parse
    if (typeof raw !== "object" || raw === null) return null;

    const account = (raw as Record<string, unknown>).account;
    const address = typeof account === "object" && account !== null
      ? (account as Record<string, unknown>).address as string | undefined
      : undefined;

    if (!address) return null;

    const leaderWalletId = this.watchedWallets.get(address);
    if (!leaderWalletId) {
      // Not a tracked wallet — silently ignore (common for multi-tenant setups)
      return null;
    }

    const event = parseTonWebhookPayload(raw, leaderWalletId);
    if (!event) return null;

    const full: NormalizedTradeEvent = { id: event.externalId, ...event };

    // Fan out to all handlers concurrently; individual handler errors must not
    // crash others — the route layer is responsible for try/catch.
    await Promise.allSettled(this.handlers.map((h) => h(full)));

    return full;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  isWatching(address: string): boolean {
    return this.watchedWallets.has(address);
  }

  watchedCount(): number {
    return this.watchedWallets.size;
  }
}

// ─── TON/USD rate (cached) ────────────────────────────────────────────────────

/** Fallback used only when the rates endpoint is unreachable. */
const TON_USD_FALLBACK = 3;
/** In-memory cache TTL — avoids hammering the rates endpoint across leaders. */
const RATE_TTL_MS = 60_000;

let rateCache: { value: number; at: number } | null = null;

/**
 * Fetches the current TON/USD price from TonAPI `/v2/rates`, cached for 60s.
 * Never throws — returns the last good value or a conservative fallback so USD
 * estimates (and the daily-spend cap) keep working if pricing is unavailable.
 */
async function getTonUsdRate(apiKey: string): Promise<number> {
  const now = Date.now();
  if (rateCache && now - rateCache.at < RATE_TTL_MS) return rateCache.value;

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const res = await fetch("https://tonapi.io/v2/rates?tokens=ton&currencies=usd", { headers });
    if (!res.ok) return rateCache?.value ?? TON_USD_FALLBACK;

    const json = (await res.json()) as {
      rates?: { TON?: { prices?: { USD?: number } } };
    };
    const price = json.rates?.TON?.prices?.USD;

    if (typeof price === "number" && price > 0) {
      rateCache = { value: price, at: now };
      return price;
    }
    return rateCache?.value ?? TON_USD_FALLBACK;
  } catch {
    return rateCache?.value ?? TON_USD_FALLBACK;
  }
}
