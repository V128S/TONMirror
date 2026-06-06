/**
 * Unit tests for whaleActivityService.getForLeader()
 *
 * Mocks the trade source and leadersRepo so no DB or network is touched.
 * Focus: period windowing + PnL aggregation (bought/sold/netPnl/roi).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const getRecentTrades = vi.fn();
vi.mock("@/modules/trade-ingestion", () => ({
  getTradeSource: vi.fn(async () => ({ getRecentTrades })),
}));

vi.mock("@/server/repositories/leaders.repo", () => ({
  leadersRepo: { findById: vi.fn() },
}));

import { whaleActivityService } from "@/server/services/whale-activity.service";
import { leadersRepo } from "@/server/repositories/leaders.repo";

const HOUR = 3_600_000;

function swap(overrides: Record<string, unknown> = {}) {
  return {
    id:                  "x",
    externalId:          "x",
    leaderWalletId:      "UQLeaderAddr",
    leaderAddress:       "UQLeaderAddr",
    txHash:              "0xabc",
    timestamp:           new Date(),
    soldToken:           "TON",
    boughtToken:         "USDT",
    soldAmountDecimal:   100,
    boughtAmountDecimal: 300,
    usdEstimate:         300,
    dex:                 "ston.fi",
    sourceProvider:      "mock" as const,
    rawSourceJson:       {},
    ...overrides,
  };
}

describe("whaleActivityService.getForLeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (leadersRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "leader_db_id",
      address: "UQLeaderAddr",
    });
  });

  it("returns null for an unknown leader", async () => {
    (leadersRepo.findById as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    const result = await whaleActivityService.getForLeader("nope", "week");
    expect(result).toBeNull();
  });

  it("computes net PnL as sold (TON received) minus bought (TON spent)", async () => {
    getRecentTrades.mockResolvedValue([
      // buy: spend TON to get USDT → bought leg, usd 300
      swap({ externalId: "b1", soldToken: "TON", boughtToken: "USDT", usdEstimate: 300 }),
      // sell: receive TON for USDT → sold leg, usd 500
      swap({ externalId: "s1", soldToken: "USDT", boughtToken: "TON", usdEstimate: 500 }),
    ]);

    const result = await whaleActivityService.getForLeader("leader_db_id", "week");
    expect(result).not.toBeNull();
    expect(result!.stats.boughtUsd).toBe(300);
    expect(result!.stats.soldUsd).toBe(500);
    expect(result!.stats.netPnlUsd).toBe(200);
    expect(result!.stats.roi).toBeCloseTo(200 / 300, 6);
    expect(result!.stats.buys).toBe(1);
    expect(result!.stats.sells).toBe(1);
  });

  it("filters out trades outside the period window", async () => {
    getRecentTrades.mockResolvedValue([
      swap({ externalId: "recent", timestamp: new Date(Date.now() - 2 * HOUR) }),
      swap({ externalId: "old",    timestamp: new Date(Date.now() - 48 * HOUR) }),
    ]);

    const day = await whaleActivityService.getForLeader("leader_db_id", "day");
    expect(day!.trades).toHaveLength(1);
    expect(day!.trades[0].id).toBe("recent");
  });

  it("roi is null when there are no buys", async () => {
    getRecentTrades.mockResolvedValue([
      swap({ externalId: "s1", soldToken: "USDT", boughtToken: "TON", usdEstimate: 500 }),
    ]);
    const result = await whaleActivityService.getForLeader("leader_db_id", "month");
    expect(result!.stats.boughtUsd).toBe(0);
    expect(result!.stats.roi).toBeNull();
    expect(result!.stats.netPnlUsd).toBe(500);
  });

  it("degrades to an empty window when the source throws", async () => {
    getRecentTrades.mockRejectedValue(new Error("TonAPI down"));
    const result = await whaleActivityService.getForLeader("leader_db_id", "week");
    expect(result!.trades).toEqual([]);
    expect(result!.stats.tradeCount).toBe(0);
    expect(result!.stats.netPnlUsd).toBe(0);
  });
});
