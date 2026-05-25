import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { decisionService } from "@/server/services/decision.service";
import { buildEvent, DEMO_SCENARIOS } from "@/modules/trade-ingestion/mock-source";

const bodySchema = z.object({
  type:     z.enum(["profitable", "risky", "blocked_token"]).default("profitable"),
  leaderId: z.string().optional(), // override which leader emits the trade
});

/**
 * POST /api/demo/trade
 * Emits a fake trade signal, runs the decision pipeline, returns the results.
 * Used by the Settings demo panel.
 */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
  }

  try {
    const body   = await req.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { type, leaderId } = parsed.data;
    const template = DEMO_SCENARIOS[type];

    // Pick the leader to emit from
    let leader;
    if (leaderId) {
      leader = await prisma.leaderWallet.findUnique({ where: { id: leaderId } });
    }

    // Default leader selection per scenario type
    if (!leader) {
      const nickname =
        type === "profitable"    ? "Alpha Whale 🐋" :
        type === "risky"         ? "DeFi Degen 🎰"  :
        /* blocked_token */        "DeFi Degen 🎰";

      leader = await prisma.leaderWallet.findFirst({
        where: { nickname, isActive: true },
      });
    }

    if (!leader) {
      return NextResponse.json({ error: "No active leader found — run /api/demo/seed first" }, { status: 422 });
    }

    const externalId = `demo_${type}_${Date.now()}`;
    const event = buildEvent(template, leader.id, leader.address, externalId);

    const decisionsCreated = await decisionService.processTradeEvent(event);

    return NextResponse.json({
      data: {
        ok:               true,
        scenario:         type,
        leaderNickname:   leader.nickname,
        tradeExternalId:  externalId,
        decisionsCreated,
        trade: {
          soldToken:   event.soldToken,
          boughtToken: event.boughtToken,
          soldAmount:  event.soldAmountDecimal,
          usdEstimate: event.usdEstimate,
        },
      },
    });
  } catch (err) {
    console.error("[POST /api/demo/trade]", err);
    return NextResponse.json({ error: "Failed to emit demo trade" }, { status: 500 });
  }
}
