/**
 * Types for the strategy evaluation module.
 * Framework-agnostic — no Next.js / Prisma imports.
 */
import type { NormalizedTradeEvent } from "../trade-ingestion/types";

// ─── Input ────────────────────────────────────────────────────────────────────

export interface StrategySnapshot {
  id: string;
  mode: "fixed_amount" | "percent_of_leader";
  fixedAmount?: number | null;
  percentOfLeader?: number | null;
  maxTradeSize?: number | null;
  slippageBps: number;
  allowedTokens: string[];
  blockedTokens: string[];
  copySells: boolean;
  dailyMaxSpend?: number | null;
  requireManualConfirm: boolean;
}

export interface EvaluateStrategyInput {
  tradeEvent: NormalizedTradeEvent;
  strategy: StrategySnapshot;
  /** USD already spent today for this strategy (for daily cap check) */
  dailySpendSoFar: number;
  /** Leader risk score 1–10 (drives soft flags) */
  leaderRiskScore: number;
}

// ─── Output ───────────────────────────────────────────────────────────────────

export type RiskFlag =
  | "blocked_token"
  | "not_in_allowlist"
  | "sell_not_copied"
  | "exceeds_max_trade_size"
  | "exceeds_daily_cap"
  | "high_risk_leader";

export type DecisionOutcome = "accepted" | "rejected" | "manual_review";

export interface StrategyDecisionResult {
  outcome: DecisionOutcome;
  reason: string;
  riskFlags: RiskFlag[];
  plannedSoldToken: string;
  plannedBoughtToken: string;
  /** Planned amount in USD */
  plannedAmountDecimal?: number;
}

// ─── Interface ────────────────────────────────────────────────────────────────

export interface StrategyEvaluator {
  evaluate(input: EvaluateStrategyInput): Promise<StrategyDecisionResult>;
}
