/**
 * DecisionService — orchestrates the copy-trade decision pipeline.
 *
 * For each incoming NormalizedTradeEvent it:
 *   1. Loads all active FollowStrategy rows for that leader
 *   2. Evaluates each strategy via StrategyEvaluator
 *   3. Writes CopyDecision row
 *   4. Creates a CopyExecution (pending or quoted)
 *
 * NEVER throws — wraps every step in try/catch and writes AuditLog on error.
 */
import { prisma } from "@/lib/prisma";
import { DefaultStrategyEvaluator } from "@/modules/strategy/evaluator";
import { strategiesRepo } from "@/server/repositories/strategies.repo";
import { tradesRepo }     from "@/server/repositories/trades.repo";
import { decisionsRepo }  from "@/server/repositories/decisions.repo";
import { executionsRepo } from "@/server/repositories/executions.repo";
import { telegramNotifyService } from "@/server/services/telegram-notify.service";
import type { NormalizedTradeEvent } from "@/modules/trade-ingestion/types";

const evaluator = new DefaultStrategyEvaluator();

export const decisionService = {
  /**
   * Main entry point. Persists the trade event then runs the pipeline.
   * Returns the number of decisions created.
   */
  async processTradeEvent(event: NormalizedTradeEvent): Promise<number> {
    // 1. Upsert trade event
    let tradeRecord;
    try {
      tradeRecord = await tradesRepo.upsert({
        externalId:          event.externalId,
        leaderWalletId:      event.leaderWalletId,
        txHash:              event.txHash,
        timestamp:           event.timestamp,
        soldToken:           event.soldToken,
        boughtToken:         event.boughtToken,
        soldAmountDecimal:   event.soldAmountDecimal,
        boughtAmountDecimal: event.boughtAmountDecimal,
        usdEstimate:         event.usdEstimate,
        dex:                 event.dex,
        status:              "processed",
        rawSourceJson:       event.rawSourceJson,
        sourceProvider:      event.sourceProvider === "mock" ? "mock" : "ton_webhook",
      });
    } catch (err) {
      await writeErrorLog("upsert_trade", event.externalId, err);
      return 0;
    }

    // 2. Load active strategies for this leader
    let strategies;
    try {
      strategies = await strategiesRepo.listActiveForLeader(event.leaderWalletId);
    } catch (err) {
      await writeErrorLog("load_strategies", event.leaderWalletId, err);
      return 0;
    }

    let decisionsCreated = 0;

    for (const strategy of strategies) {
      try {
        // 2.5. Idempotency: skip if we already decided on this trade for this strategy.
        // Makes the ingestion cron safe to re-run over the same recent window.
        if (await decisionsRepo.existsFor(tradeRecord.id, strategy.id)) {
          continue;
        }

        // 3. Check daily spend for cap enforcement
        const dailySpend = await strategiesRepo.dailySpendUsd(strategy.id);

        // 4. Evaluate
        const result = await evaluator.evaluate({
          tradeEvent:      event,
          strategy: {
            id:                   strategy.id,
            mode:                 strategy.mode,
            fixedAmount:          strategy.fixedAmount,
            percentOfLeader:      strategy.percentOfLeader,
            maxTradeSize:         strategy.maxTradeSize,
            slippageBps:          strategy.slippageBps,
            allowedTokens:        strategy.allowedTokens,
            blockedTokens:        strategy.blockedTokens,
            copySells:            strategy.copySells,
            dailyMaxSpend:        strategy.dailyMaxSpend,
            requireManualConfirm: strategy.requireManualConfirm,
          },
          dailySpendSoFar: dailySpend,
          leaderRiskScore: strategy.leaderWallet.riskScore,
        });

        // 5. Write CopyDecision
        const decision = await decisionsRepo.create({
          tradeEventId:         tradeRecord.id,
          userId:               strategy.userId,
          strategyId:           strategy.id,
          decision:             result.outcome,
          reason:               result.reason,
          plannedSoldToken:     result.plannedSoldToken,
          plannedBoughtToken:   result.plannedBoughtToken,
          plannedAmountDecimal: result.plannedAmountDecimal,
          estimatedSlippageBps: strategy.slippageBps,
          riskFlags:            result.riskFlags,
        });

        decisionsCreated++;

        // 6. Write CopyExecution for accepted + manual_review
        let executionId: string | undefined;
        if (result.outcome !== "rejected") {
          const execution = await executionsRepo.create({
            decisionId: decision.id,
            userId:     strategy.userId,
            // auto strategies get quoted immediately; manual-confirm stays pending
            status:     result.outcome === "manual_review" || strategy.requireManualConfirm
              ? "pending"
              : "quoted",
          });
          executionId = execution.id;
        }

        // 7. Telegram push notification (fire-and-forget, never throws)
        telegramNotifyService.notifyDecision({
          userId:               strategy.userId,
          outcome:              result.outcome,
          leaderNickname:       strategy.leaderWallet.nickname,
          soldToken:            result.plannedSoldToken,
          boughtToken:          result.plannedBoughtToken,
          plannedAmountDecimal: result.plannedAmountDecimal ?? null,
          executionId,
          riskFlags:            result.riskFlags,
        }).catch((err) => console.warn("[DecisionService] notify failed:", err));
      } catch (err) {
        await writeErrorLog("evaluate_strategy", strategy.id, err);
      }
    }

    return decisionsCreated;
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function writeErrorLog(action: string, entityId: string, err: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType:  "decision_pipeline",
        entityId,
        action:      `error:${action}`,
        payloadJson: { message: String(err) },
      },
    });
  } catch {
    // Never let audit log failures crash anything
    console.error("[DecisionService] audit log write failed:", err);
  }
}
