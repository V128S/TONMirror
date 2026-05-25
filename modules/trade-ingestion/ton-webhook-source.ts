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
 * `getRecentTrades` is a stub — a full implementation would query the
 * TON indexer REST API using TON_API_KEY.
 *
 * Enabled only when NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 * When disabled the webhook route returns 403 before ever touching this class.
 */

import type { LeaderTradeSource, NormalizedTradeEvent, TradeEventHandler } from "./types";
import { parseTonWebhookPayload } from "./ton-payload-parser";

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
   * Returns recent trades for a wallet by querying the TON indexer.
   *
   * TODO (production): call TonAPI GET /v2/accounts/{address}/events
   * with Authorization: Bearer <TON_API_KEY>, map to NormalizedTradeEvent[].
   *
   * Stub returns empty array so the webhook route never crashes on init.
   */
  async getRecentTrades(_address: string): Promise<NormalizedTradeEvent[]> {
    // TODO(live): fetch from https://tonapi.io/v2/accounts/{address}/events
    return [];
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
