import { describe, it, expect } from "vitest";
import { scoreWallet } from "@/modules/whale-discovery/scorer";
import type { SwapEvent } from "@/modules/whale-discovery/types";

const makeSwap = (usdIn: number, usdOut: number, daysAgo: number): SwapEvent => ({
  txHash:    `tx_${daysAgo}_${usdIn}`,
  timestamp: new Date(Date.now() - daysAgo * 86_400_000),
  soldToken:  "TON",
  boughtToken: "USDT",
  usdIn,
  usdOut,
  dex: "ston.fi",
});

describe("scoreWallet", () => {
  it("returns zero score for empty swap list", () => {
    const result = scoreWallet("UQBtest", []);
    expect(result.score).toBe(0);
    expect(result.winRate).toBe(0);
    expect(result.volumeUsd30d).toBe(0);
  });

  it("calculates win rate correctly", () => {
    const swaps = [
      makeSwap(100, 110, 1), // profitable
      makeSwap(100, 90, 2),  // loss
      makeSwap(100, 105, 3), // profitable
    ];
    const result = scoreWallet("UQBtest", swaps);
    // 2 profitable out of 3 = 0.666...
    expect(result.winRate).toBeCloseTo(0.667, 2);
  });

  it("assigns alpha tag for high-scoring wallet", () => {
    // 30 large profitable trades in 30 days
    const swaps = Array.from({ length: 30 }, (_, i) =>
      makeSwap(5000, 5500, i + 1)
    );
    const result = scoreWallet("UQBtest", swaps);
    expect(result.tags).toContain("alpha");
    expect(result.score).toBeGreaterThanOrEqual(0.65);
  });

  it("assigns balanced tag for mid-range score", () => {
    const swaps = Array.from({ length: 5 }, (_, i) =>
      makeSwap(500, 520, i + 1)
    );
    const result = scoreWallet("UQBtest", swaps);
    expect(result.tags).toContain("balanced");
  });

  it("only counts swaps within last 30 days", () => {
    const swaps = [
      makeSwap(10000, 12000, 1),   // in window
      makeSwap(10000, 12000, 31),  // outside window
    ];
    const result = scoreWallet("UQBtest", swaps);
    expect(result.tradeCount30d).toBe(1);
  });
});
