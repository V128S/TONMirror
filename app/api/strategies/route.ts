import { NextResponse } from "next/server";
import { z } from "zod";
import { strategiesRepo } from "@/server/repositories/strategies.repo";
import { prisma } from "@/lib/prisma";

// ─── GET /api/strategies ──────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // userId is the DB CUID returned by /api/user/init
    const userId = searchParams.get("userId") ?? "";

    if (!userId) {
      return NextResponse.json({ data: [] });
    }

    const strategies = await strategiesRepo.listByUser(userId);
    return NextResponse.json({ data: strategies });
  } catch (err) {
    console.error("[GET /api/strategies]", err);
    return NextResponse.json({ error: "Failed to load strategies" }, { status: 500 });
  }
}

// ─── POST /api/strategies ─────────────────────────────────────────────────────

const createSchema = z.object({
  leaderWalletId:       z.string().cuid(),
  /** DB CUID from /api/user/init — required */
  userId:               z.string().cuid(),
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

    const { userId, ...rest } = parsed.data;

    // Verify the user exists (was created by /api/user/init)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: "User not found — call /api/user/init first" },
        { status: 404 },
      );
    }

    // Guard: can't follow the same leader twice
    const existing = await strategiesRepo.findByUserAndLeader(userId, rest.leaderWalletId);
    if (existing) {
      return NextResponse.json({ error: "Already following this leader" }, { status: 409 });
    }

    const strategy = await strategiesRepo.create({ userId, ...rest });
    return NextResponse.json({ data: strategy }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/strategies]", err);
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}
