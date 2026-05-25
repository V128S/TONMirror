import { NextResponse } from "next/server";
import { z } from "zod";
import { leadersRepo } from "@/server/repositories/leaders.repo";

// ─── GET /api/leaders ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "demo_user";

    const [leaders, followedIds] = await Promise.all([
      leadersRepo.list(),
      leadersRepo.getFollowedIds(userId).catch(() => new Set<string>()),
    ]);

    const data = leaders.map((l) => ({
      ...l,
      isFollowing: followedIds.has(l.id),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error("[GET /api/leaders]", err);
    return NextResponse.json({ error: "Failed to load leaders" }, { status: 500 });
  }
}

// ─── POST /api/leaders ────────────────────────────────────────────────────────

const createSchema = z.object({
  nickname:      z.string().min(1).max(100),
  address:       z.string().min(10).max(100),
  tags:          z.array(z.string()).optional().default([]),
  riskScore:     z.number().int().min(1).max(10).optional(),
  activityScore: z.number().min(0).max(1).optional(),
  winRateApprox: z.number().min(0).max(1).optional(),
  notes:         z.string().max(500).optional(),
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

    const data = await leadersRepo.create({ ...parsed.data, sourceType: "manual" });
    return NextResponse.json({ data }, { status: 201 });
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json({ error: "Address already exists" }, { status: 409 });
    }
    console.error("[POST /api/leaders]", err);
    return NextResponse.json({ error: "Failed to create leader" }, { status: 500 });
  }
}
