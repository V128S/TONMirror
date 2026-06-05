import { NextResponse } from "next/server";
import { z } from "zod";
import { strategiesRepo } from "@/server/repositories/strategies.repo";
import { resolveAuthUserId } from "@/server/auth/telegram-auth";

type Params = { params: Promise<{ id: string }> };

/** 403 when a verified caller tries to touch a strategy they don't own. */
function ownsOrNull(strategyUserId: string, authedId: string | null): boolean {
  return authedId === null || strategyUserId === authedId;
}

const updateSchema = z.object({
  mode:                 z.enum(["fixed_amount", "percent_of_leader"]).optional(),
  fixedAmount:          z.number().positive().optional(),
  percentOfLeader:      z.number().positive().max(100).optional(),
  maxTradeSize:         z.number().positive().optional(),
  slippageBps:          z.number().int().min(0).max(10000).optional(),
  allowedTokens:        z.array(z.string()).optional(),
  blockedTokens:        z.array(z.string()).optional(),
  copySells:            z.boolean().optional(),
  dailyMaxSpend:        z.number().positive().optional(),
  requireManualConfirm: z.boolean().optional(),
  isPaused:             z.boolean().optional(),
});

// ─── PATCH /api/strategies/[id] ───────────────────────────────────────────────

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const strategy = await strategiesRepo.findById(id);
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!ownsOrNull(strategy.userId, await resolveAuthUserId(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await strategiesRepo.update(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("[PATCH /api/strategies/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE /api/strategies/[id] ─────────────────────────────────────────────

export async function DELETE(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const strategy = await strategiesRepo.findById(id);
    if (!strategy) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!ownsOrNull(strategy.userId, await resolveAuthUserId(req))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await strategiesRepo.delete(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/strategies/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
