/**
 * Trade-ingestion module entry point.
 *
 * Exports:
 * - Types (NormalizedTradeEvent, LeaderTradeSource, …)
 * - getTradeSource()  — factory, gated by NEXT_PUBLIC_ENABLE_LIVE_SOURCE
 * - Both concrete sources (for DI / testing)
 */

export type { NormalizedTradeEvent, LeaderTradeSource, TradeEventHandler } from "./types";
export { MockLeaderTradeSource } from "./mock-source";
export { TonWebhookTradeSource } from "./ton-webhook-source";
export { parseTonWebhookPayload, extractSwap, TonWebhookPayloadSchema } from "./ton-payload-parser";
export type { ParsedSwap, TonWebhookPayload } from "./ton-payload-parser";

import type { LeaderTradeSource } from "./types";

/**
 * Returns the appropriate LeaderTradeSource for the current environment.
 *
 * - NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true  → TonWebhookTradeSource
 * - otherwise                            → MockLeaderTradeSource (default)
 */
export async function getTradeSource(): Promise<LeaderTradeSource> {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true") {
    const { TonWebhookTradeSource } = await import("./ton-webhook-source");
    return new TonWebhookTradeSource();
  }

  const { MockLeaderTradeSource } = await import("./mock-source");
  return new MockLeaderTradeSource();
}
