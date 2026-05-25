import { describe, it, expect } from "vitest";
import { DefaultStrategyEvaluator } from "@/modules/strategy/evaluator";
import type { EvaluateStrategyInput, StrategySnapshot } from "@/modules/strategy/types";
import type { NormalizedTradeEvent } from "@/modules/trade-ingestion/types";

const evaluator = new DefaultStrategyEvaluator();

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const baseEvent: NormalizedTradeEvent = {
  id:                  "test_001",
  externalId:          "test_001",
  leaderWalletId:      "leader_01",
  leaderAddress:       "UQBFkB...",
  txHash:              "0xabc",
  timestamp:           new Date(),
  soldToken:           "TON",
  boughtToken:         "USDT",
  soldAmountDecimal:   100,
  boughtAmountDecimal: 615,
  usdEstimate:         615,
  dex:                 "ston.fi",
  sourceProvider:      "mock",
  rawSourceJson:       { mock: true },
};

const baseStrategy: StrategySnapshot = {
  id:                   "strat_01",
  mode:                 "fixed_amount",
  fixedAmount:          10,
  percentOfLeader:      null,
  maxTradeSize:         null,
  slippageBps:          100,
  allowedTokens:        [],
  blockedTokens:        [],
  copySells:            true,
  dailyMaxSpend:        null,
  requireManualConfirm: false,
};

const baseInput: EvaluateStrategyInput = {
  tradeEvent:      baseEvent,
  strategy:        baseStrategy,
  dailySpendSoFar: 0,
  leaderRiskScore: 3,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("DefaultStrategyEvaluator", () => {

  it("accepts a clean trade with no restrictions", async () => {
    const result = await evaluator.evaluate(baseInput);
    expect(result.outcome).toBe("accepted");
    expect(result.riskFlags).toHaveLength(0);
    expect(result.plannedAmountDecimal).toBe(10);
  });

  it("rejects when boughtToken is in blockedTokens", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: { ...baseStrategy, blockedTokens: ["USDT"] },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("rejected");
    expect(result.riskFlags).toContain("blocked_token");
  });

  it("rejects when boughtToken is not in non-empty allowedTokens", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: { ...baseStrategy, allowedTokens: ["STON", "NOT"] },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("rejected");
    expect(result.riskFlags).toContain("not_in_allowlist");
  });

  it("accepts when boughtToken IS in non-empty allowedTokens", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: { ...baseStrategy, allowedTokens: ["TON", "USDT"] },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("accepted");
  });

  it("rejects a sell trade when copySells is false", async () => {
    const sellEvent: NormalizedTradeEvent = {
      ...baseEvent,
      soldToken:   "STON",   // selling a position
      boughtToken: "TON",    // getting base back
    };
    const input: EvaluateStrategyInput = {
      ...baseInput,
      tradeEvent: sellEvent,
      strategy:   { ...baseStrategy, copySells: false },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("rejected");
    expect(result.riskFlags).toContain("sell_not_copied");
  });

  it("rejects when plannedAmount exceeds maxTradeSize", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: { ...baseStrategy, maxTradeSize: 5, fixedAmount: 10 },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("rejected");
    expect(result.riskFlags).toContain("exceeds_max_trade_size");
  });

  it("rejects when daily cap would be exceeded", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy:        { ...baseStrategy, dailyMaxSpend: 50 },
      dailySpendSoFar: 45, // 45 + 10 = 55 > 50
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("rejected");
    expect(result.riskFlags).toContain("exceeds_daily_cap");
  });

  it("elevates to manual_review for high-risk leader (score >= 7)", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      leaderRiskScore: 8,
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("manual_review");
    expect(result.riskFlags).toContain("high_risk_leader");
  });

  it("elevates to manual_review when requireManualConfirm is true", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: { ...baseStrategy, requireManualConfirm: true },
    };
    const result = await evaluator.evaluate(input);
    expect(result.outcome).toBe("manual_review");
  });

  it("calculates plannedAmount from percent_of_leader mode", async () => {
    const input: EvaluateStrategyInput = {
      ...baseInput,
      strategy: {
        ...baseStrategy,
        mode:            "percent_of_leader",
        fixedAmount:     null,
        percentOfLeader: 10,
      },
    };
    const result = await evaluator.evaluate(input);
    // 10% of $615 usdEstimate = $61.50
    expect(result.plannedAmountDecimal).toBeCloseTo(61.5, 1);
  });
});
