/**
 * Unit tests for executionService.fetchQuote() copy-size conversion.
 *
 * Verifies the USD → sold-token-units bridge: on the live path the planned USD
 * amount must be converted before it reaches Omniston; in demo it passes
 * through untouched so mock numbers stay deterministic.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getQuote = vi.fn();
vi.mock("@/modules/omniston", () => ({
  getQuoteProvider:     vi.fn(async () => ({ getQuote })),
  getExecutionProvider: vi.fn(),
}));

vi.mock("@/server/repositories/executions.repo", () => ({
  executionsRepo: { update: vi.fn(), findById: vi.fn() },
}));

vi.mock("@/server/services/pricing.service", () => ({
  usdToTokenAmount: vi.fn(),
}));

import { executionService } from "@/server/services/execution.service";
import { usdToTokenAmount }  from "@/server/services/pricing.service";

const QUOTE = {
  quoteId: "q1", soldToken: "TON", boughtToken: "USDT",
  amountInDecimal: 3.3, amountOutDecimal: 10, rate: 3, slippageBps: 100,
  routeSummary: "x", resolverName: "y", expiresAt: new Date(), isLive: true,
};

const INPUT = {
  executionId: "e1", soldToken: "TON", boughtToken: "USDT",
  amountIn: 10, slippageBps: 100,
};

describe("executionService.fetchQuote copy-size conversion", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    getQuote.mockResolvedValue(QUOTE);
  });

  afterEach(() => { process.env = originalEnv; });

  it("converts USD → sold-token units on the live path", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "true";
    vi.mocked(usdToTokenAmount).mockResolvedValue(3.3); // $10 / 3 ≈ 3.3 TON

    await executionService.fetchQuote(INPUT);

    expect(usdToTokenAmount).toHaveBeenCalledWith(10, "TON");
    expect(getQuote).toHaveBeenCalledWith(
      expect.objectContaining({ amountInDecimal: 3.3 }),
    );
  });

  it("passes the USD amount straight through in demo (no conversion)", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "false";

    await executionService.fetchQuote(INPUT);

    expect(usdToTokenAmount).not.toHaveBeenCalled();
    expect(getQuote).toHaveBeenCalledWith(
      expect.objectContaining({ amountInDecimal: 10 }),
    );
  });
});
