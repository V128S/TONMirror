import { NextResponse } from "next/server";
import { z } from "zod";
import { tradesRepo } from "@/server/repositories/trades.repo";
import { resolveAuthUserId } from "@/server/auth/telegram-auth";
import { toFriendlyAddress, whaleAlias, isAddressLikeNickname } from "@/lib/ton-address";

const querySchema = z.object({
  leaderId: z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(30),
  cursor:   z.string().optional(),
});

// ─── GET /api/activity ────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      leaderId: searchParams.get("leaderId") ?? undefined,
      limit:    searchParams.get("limit")    ?? undefined,
      cursor:   searchParams.get("cursor")   ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // Scope the feed to the signed-in user's own copies when we can identify
    // them (real Telegram client). Falls back to a userId query param, else the
    // global feed (browser/demo).
    const userId =
      (await resolveAuthUserId(req)) ?? searchParams.get("userId") ?? undefined;

    const events = await tradesRepo.activityFeed({ ...parsed.data, userId });

    // Normalize to a clean response shape
    type ActivityEvent = (typeof events)[number];
    const data = events.map((event: ActivityEvent) => {
      const latestDecision = event.decisions[0] ?? null;
      const latestExecution = latestDecision?.executions[0] ?? null;

      return {
        id:                  event.id,
        externalId:          event.externalId,
        timestamp:           event.timestamp,
        txHash:              event.txHash,
        soldToken:           event.soldToken,
        boughtToken:         event.boughtToken,
        soldAmountDecimal:   event.soldAmountDecimal,
        boughtAmountDecimal: event.boughtAmountDecimal,
        usdEstimate:         event.usdEstimate,
        dex:                 event.dex,
        sourceProvider:      event.sourceProvider,
        leader: {
          id:       event.leaderWallet.id,
          nickname: isAddressLikeNickname(event.leaderWallet.nickname)
            ? whaleAlias(toFriendlyAddress(event.leaderWallet.address))
            : event.leaderWallet.nickname,
          address:  toFriendlyAddress(event.leaderWallet.address),
        },
        decision: latestDecision
          ? {
              id:        latestDecision.id,
              outcome:   latestDecision.decision,
              reason:    latestDecision.reason,
              riskFlags: latestDecision.riskFlags,
              plannedAmountDecimal: latestDecision.plannedAmountDecimal,
            }
          : null,
        execution: latestExecution
          ? {
              id:          latestExecution.id,
              status:      latestExecution.status,
              estimatedOut: latestExecution.estimatedOut,
              txHash:      latestExecution.txHash,
            }
          : null,
      };
    });

    const nextCursor = events.length === parsed.data.limit
      ? events[events.length - 1]?.id
      : undefined;

    return NextResponse.json({ data, nextCursor });
  } catch (err) {
    console.error("[GET /api/activity]", err);
    return NextResponse.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
