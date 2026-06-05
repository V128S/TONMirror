/**
 * IngestionService — the automatic copy-trade loop, serverless-safe.
 *
 * There is no long-lived process on Vercel, so we do NOT rely on
 * `LeaderTradeSource.start()` / setInterval. Instead a cron route
 * (`/api/cron/poll-trades`) calls `pollAllLeaders()` on a schedule.
 *
 * The same code path runs for mock and live sources — `getTradeSource()`
 * picks the implementation from NEXT_PUBLIC_ENABLE_LIVE_SOURCE.
 *
 * Idempotency: `tradesRepo.upsert` dedups on externalId and the decision
 * pipeline skips a strategy when a CopyDecision already exists, so re-polling
 * the same recent window never creates duplicates.
 *
 * NEVER throws — per-leader try/catch + AuditLog on error.
 */
import { prisma } from "@/lib/prisma";
import { getTradeSource } from "@/modules/trade-ingestion";
import { leadersRepo }    from "@/server/repositories/leaders.repo";
import { decisionService } from "@/server/services/decision.service";

export type PollResult = {
  leaders:    number;
  eventsSeen: number;
  decisions:  number;
  durationMs: number;
};

export const ingestionService = {
  /**
   * Poll recent trades for every actively-followed leader and run each
   * through the decision pipeline.
   */
  async pollAllLeaders(): Promise<PollResult> {
    const start = Date.now();

    const source  = await getTradeSource();
    const leaders = await leadersRepo.listFollowedActive();

    let eventsSeen = 0;
    let decisions  = 0;

    for (const leader of leaders) {
      try {
        const trades = await source.getRecentTrades(leader.address);

        for (const event of trades) {
          // The source fills leaderWalletId from its own registry (often just
          // the address when not subscribed). Authoritatively bind it to the
          // DB leader id so decisions attach to the right wallet.
          const created = await decisionService.processTradeEvent({
            ...event,
            leaderWalletId: leader.id,
            leaderAddress:  leader.address,
          });

          eventsSeen += 1;
          decisions  += created;
        }
      } catch (err) {
        await writeErrorLog("poll_leader", leader.id, err);
      }
    }

    return {
      leaders:    leaders.length,
      eventsSeen,
      decisions,
      durationMs: Date.now() - start,
    };
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function writeErrorLog(action: string, entityId: string, err: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType:  "ingestion_loop",
        entityId,
        action:      `error:${action}`,
        payloadJson: { message: String(err) },
      },
    });
  } catch {
    console.error("[IngestionService] audit log write failed:", err);
  }
}
