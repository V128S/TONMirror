/**
 * DefaultStrategyEvaluator — pure business logic.
 * No framework imports; fully unit-testable.
 *
 * Decision rules (in order of precedence):
 *  1. Blocked-token check  → rejected
 *  2. Allowlist check      → rejected
 *  3. Sell-not-copied      → rejected
 *  4. Max trade size       → rejected
 *  5. Daily spend cap      → rejected
 *  6. High-risk leader     → manual_review (soft flag, non-fatal)
 *  7. requireManualConfirm → promotes accepted → manual_review
 */
import { isSellTrade } from "../trade-ingestion/mock-source";
import type {
  EvaluateStrategyInput,
  RiskFlag,
  StrategyDecisionResult,
  StrategyEvaluator,
} from "./types";

export class DefaultStrategyEvaluator implements StrategyEvaluator {
  async evaluate(input: EvaluateStrategyInput): Promise<StrategyDecisionResult> {
    const { tradeEvent, strategy, dailySpendSoFar, leaderRiskScore } = input;
    const riskFlags: RiskFlag[] = [];

    // ── Planned amount ─────────────────────────────────────────────────────────
    let plannedAmount: number | undefined;

    if (strategy.mode === "fixed_amount" && strategy.fixedAmount != null) {
      plannedAmount = strategy.fixedAmount;
    } else if (
      strategy.mode === "percent_of_leader" &&
      strategy.percentOfLeader != null &&
      tradeEvent.usdEstimate != null
    ) {
      plannedAmount = (tradeEvent.usdEstimate * strategy.percentOfLeader) / 100;
    }

    // ── Hard rejection rules ───────────────────────────────────────────────────

    // 1. Blocked token (buy side)
    const boughtBlocked = strategy.blockedTokens.includes(tradeEvent.boughtToken);
    const soldBlocked   = strategy.blockedTokens.includes(tradeEvent.soldToken);
    if (boughtBlocked || soldBlocked) {
      return {
        outcome:               "rejected",
        reason:                `Token ${boughtBlocked ? tradeEvent.boughtToken : tradeEvent.soldToken} is in the blocklist`,
        riskFlags:             ["blocked_token"],
        plannedSoldToken:      tradeEvent.soldToken,
        plannedBoughtToken:    tradeEvent.boughtToken,
        plannedAmountDecimal:  plannedAmount,
      };
    }

    // 2. Allowlist — only applies when non-empty
    if (strategy.allowedTokens.length > 0) {
      const buyAllowed  = strategy.allowedTokens.includes(tradeEvent.boughtToken);
      const sellAllowed = strategy.allowedTokens.includes(tradeEvent.soldToken);
      if (!buyAllowed && !sellAllowed) {
        return {
          outcome:               "rejected",
          reason:                `Neither ${tradeEvent.soldToken} nor ${tradeEvent.boughtToken} is in the allowlist`,
          riskFlags:             ["not_in_allowlist"],
          plannedSoldToken:      tradeEvent.soldToken,
          plannedBoughtToken:    tradeEvent.boughtToken,
          plannedAmountDecimal:  plannedAmount,
        };
      }
    }

    // 3. Copy-sells flag
    if (!strategy.copySells && isSellTrade(tradeEvent)) {
      return {
        outcome:               "rejected",
        reason:                "Trade is a sell and copy_sells is disabled",
        riskFlags:             ["sell_not_copied"],
        plannedSoldToken:      tradeEvent.soldToken,
        plannedBoughtToken:    tradeEvent.boughtToken,
        plannedAmountDecimal:  plannedAmount,
      };
    }

    // 4. Max trade size
    if (strategy.maxTradeSize != null && plannedAmount != null) {
      if (plannedAmount > strategy.maxTradeSize) {
        return {
          outcome:               "rejected",
          reason:                `Planned amount ${plannedAmount} exceeds max trade size ${strategy.maxTradeSize}`,
          riskFlags:             ["exceeds_max_trade_size"],
          plannedSoldToken:      tradeEvent.soldToken,
          plannedBoughtToken:    tradeEvent.boughtToken,
          plannedAmountDecimal:  plannedAmount,
        };
      }
    }

    // 5. Daily spend cap
    if (strategy.dailyMaxSpend != null && plannedAmount != null) {
      if (dailySpendSoFar + plannedAmount > strategy.dailyMaxSpend) {
        return {
          outcome:               "rejected",
          reason:                `Daily spend cap of ${strategy.dailyMaxSpend} would be exceeded`,
          riskFlags:             ["exceeds_daily_cap"],
          plannedSoldToken:      tradeEvent.soldToken,
          plannedBoughtToken:    tradeEvent.boughtToken,
          plannedAmountDecimal:  plannedAmount,
        };
      }
    }

    // ── Soft flags (non-fatal, elevate to manual_review) ──────────────────────

    if (leaderRiskScore >= 7) {
      riskFlags.push("high_risk_leader");
    }

    // ── Final decision ─────────────────────────────────────────────────────────

    // Anything with soft flags OR requireManualConfirm → manual_review
    const requiresReview = riskFlags.length > 0 || strategy.requireManualConfirm;

    return {
      outcome:               requiresReview ? "manual_review" : "accepted",
      reason:                requiresReview
        ? riskFlags.length > 0
          ? `Soft risk flags: ${riskFlags.join(", ")}`
          : "Manual confirmation required by strategy"
        : "All checks passed — auto copy",
      riskFlags,
      plannedSoldToken:      tradeEvent.soldToken,
      plannedBoughtToken:    tradeEvent.boughtToken,
      plannedAmountDecimal:  plannedAmount,
    };
  }
}
