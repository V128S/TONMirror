import { NextResponse } from "next/server";
import { z } from "zod";
import { whaleActivityService } from "@/server/services/whale-activity.service";

type Params = { params: Promise<{ id: string }> };

const querySchema = z.object({
  period: z.enum(["day", "week", "month"]).default("week"),
});

// ─── GET /api/leaders/[id]/trades?period=day|week|month ───────────────────────
// Public whale activity: the leader's recent on-chain swaps + period stats.

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      period: searchParams.get("period") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const activity = await whaleActivityService.getForLeader(id, parsed.data.period);
    if (!activity) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: activity });
  } catch (err) {
    console.error("[GET /api/leaders/[id]/trades]", err);
    return NextResponse.json({ error: "Failed to load whale activity" }, { status: 500 });
  }
}
