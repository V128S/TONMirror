import { NextResponse } from "next/server";
import { z } from "zod";
import { strategiesRepo } from "@/server/repositories/strategies.repo";
import { prisma } from "@/lib/prisma";

// ─── GET /api/strategies ──────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // In Phase 2 we always use the demo user; Phase 3 will inject real userId
    const telegramId = searchParams.get("telegramId") ?? "demo_12345";

    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return NextResponse.json({ data: [] });
    }

    const strategies = await strategiesRepo.listByUser(user.id);
    return NextResponse.json({ data: strategies });
  } catch (err) {
    console.error("[GET /api/strategies]", err);
    return NextResponse.json({ error: "Failed to load strategies" }, { status: 500 });
  }
}

// ─── POST /api/strategies ─────────────────────────────────────────────────────

const createSchema = z.object({
  leaderWalletId:       z.string().cuid(),
  telegramId:           z.string().default("demo_12345"),
  mode:                 z.enum(["fixed_amount", "percent_of_leader"]).default("fixed_amount"),
  fixedAmount:          z.number().positive().optional(),
  percentOfLeader:      z.number().positive().max(100).optional(),
  maxTradeSize:         z.number().positive().optional(),
  slippageBps:          z.number().int().min(0).max(10000).default(100),
  allowedTokens:        z.array(z.string()).default([]),
  blockedTokens:        z.array(z.string()).default([]),
  copySells:            z.boolean().default(false),
  dailyMaxSpend:        z.number().positive().optional(),
  requireManualConfirm: z.boolean().default(true),
});

export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const { telegramId, ...rest } = parsed.data;

    // Resolve or create demo user
    const user = await prisma.user.upsert({
      where:  { telegramId },
      update: {},
      create: { telegramId, isDemo: true },
    });

    // Guard: can't follow the same leader twice
    const existing = await strategiesRepo.findByUserAndLeader(user.id, rest.leaderWalletId);
    if (existing) {
      return NextResponse.json({ error: "Already following this leader" }, { status: 409 });
    }

    const strategy = await strategiesRepo.create({ userId: user.id, ...rest });
    return NextResponse.json({ data: strategy }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/strategies]", err);
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}
