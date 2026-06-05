/**
 * Unit tests for TonWebhookTradeSource.getRecentTrades() symbol normalization.
 *
 * Verifies that TonAPI's "USD₮" jetton symbol is normalized to the canonical
 * "USDT" so SUPPORTED_PAIRS / token-map resolve a real TON→USDT whale swap.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { fetchWithRetry } = vi.hoisted(() => ({ fetchWithRetry: vi.fn() }));
vi.mock("@/lib/fetch-retry", () => ({ fetchWithRetry }));

import { TonWebhookTradeSource } from "@/modules/trade-ingestion/ton-webhook-source";

function eventsResponse() {
  return {
    ok: true, status: 200,
    json: async () => ({
      events: [
        {
          event_id: "evt1",
          timestamp: 1716670000,
          actions: [
            {
              type: "JettonSwap",
              status: "ok",
              JettonSwap: {
                dex: "stonfi",
                ton_in: "10000000000",      // 10 TON sold
                ton_out: null,
                amount_in: "10000000000",
                amount_out: "61500000",     // 61.5 USDT @ 6 decimals
                jetton_master_out: { symbol: "USD₮", decimals: 6 },
              },
            },
          ],
        },
      ],
    }),
  } as Response;
}

describe("TonWebhookTradeSource symbol normalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // /v2/rates is fetched with the global fetch (not fetchWithRetry).
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true, status: 200,
      json: async () => ({ rates: { TON: { prices: { USD: 6 } } } }),
    } as Response)));
    fetchWithRetry.mockResolvedValue(eventsResponse());
  });

  afterEach(() => vi.unstubAllGlobals());

  it("normalizes TonAPI 'USD₮' to 'USDT'", async () => {
    const source = new TonWebhookTradeSource();
    const trades = await source.getRecentTrades("UQLeaderAddr");

    expect(trades).toHaveLength(1);
    expect(trades[0].soldToken).toBe("TON");
    expect(trades[0].boughtToken).toBe("USDT"); // not "USD₮"
    expect(trades[0].boughtAmountDecimal).toBeCloseTo(61.5, 2);
  });
});
