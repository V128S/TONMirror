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
import type { NormalizedTradeEvent } from "@/modules/trade-ingestion/types";
import { leadersRepo }    from "@/server/repositories/leaders.repo";
import { decisionService } from "@/server/services/decision.service";
import { getTonUsd }       from "@/server/services/pricing.service";
import { isSupportedPair } from "@/modules/omniston/token-map";

export type PollResult = {
  leaders:    number;
  eventsSeen: number;
  /** Live-path events ignored because their pair isn't in SUPPORTED_PAIRS */
  skipped:    number;
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

    // On the live path, derive USD estimates from the consolidated Omniston
    // pricing (pricing.service) rather than the source's own approximation.
    // In demo, leave the mock's seeded usdEstimate untouched so demo numbers
    // stay deterministic.
    const liveEnabled = process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true";
    const tonUsd = liveEnabled ? await getTonUsd() : 0;

    let eventsSeen = 0;
    let skipped    = 0;
    let decisions  = 0;

    for (const leader of leaders) {
      try {
        const trades = await source.getRecentTrades(leader.address);

        for (const event of trades) {
          eventsSeen += 1;

          // On the live path we copy only the vetted SUPPORTED_PAIRS; anything
          // else (an unvetted whale token) is ignored — never quoted or executed.
          // Demo keeps its full seeded variety so the control panel still works.
          if (liveEnabled && !isSupportedPair(event.soldToken, event.boughtToken)) {
            skipped += 1;
            continue;
          }

          const priced = liveEnabled ? repriceEvent(event, tonUsd) : event;

          // The source fills leaderWalletId from its own registry (often just
          // the address when not subscribed). Authoritatively bind it to the
          // DB leader id so decisions attach to the right wallet.
          const created = await decisionService.processTradeEvent({
            ...priced,
            leaderWalletId: leader.id,
            leaderAddress:  leader.address,
          });

          decisions  += created;
        }
      } catch (err) {
        await writeErrorLog("poll_leader", leader.id, err);
      }
    }

    return {
      leaders:    leaders.length,
      eventsSeen,
      skipped,
      decisions,
      durationMs: Date.now() - start,
    };
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Recompute the USD estimate for a supported-pair trade.
 *
 * Prefers the USDT leg (≈ $1) when present — this is what makes tsTON→USDT
 * (no TON leg) priceable — and otherwise falls back to the live TON→USD rate
 * for the TON leg. Anything without a USDT or TON leg keeps the source value.
 */
function repriceEvent(
  event: NormalizedTradeEvent,
  tonUsd: number,
): NormalizedTradeEvent {
  if (event.soldToken === "USDT") {
    return { ...event, usdEstimate: event.soldAmountDecimal };
  }
  if (event.boughtToken === "USDT") {
    return { ...event, usdEstimate: event.boughtAmountDecimal };
  }
  if (event.soldToken === "TON") {
    return { ...event, usdEstimate: event.soldAmountDecimal * tonUsd };
  }
  if (event.boughtToken === "TON") {
    return { ...event, usdEstimate: event.boughtAmountDecimal * tonUsd };
  }
  return event;
}

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
