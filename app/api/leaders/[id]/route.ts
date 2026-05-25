import { NextResponse } from "next/server";
import { z } from "zod";
import { leadersRepo } from "@/server/repositories/leaders.repo";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/leaders/[id] ────────────────────────────────────────────────────

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    const leader = await leadersRepo.findById(id);
    if (!leader) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: leader });
  } catch (err) {
    console.error("[GET /api/leaders/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PATCH /api/leaders/[id] ──────────────────────────────────────────────────

const updateSchema = z.object({
  nickname:      z.string().min(1).max(100).optional(),
  tags:          z.array(z.string()).optional(),
  riskScore:     z.number().int().min(1).max(10).optional(),
  activityScore: z.number().min(0).max(1).optional(),
  winRateApprox: z.number().min(0).max(1).optional(),
  notes:         z.string().max(500).optional(),
  isActive:      z.boolean().optional(),
});

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
    const data = await leadersRepo.update(id, parsed.data);
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[PATCH /api/leaders/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE /api/leaders/[id] ─────────────────────────────────────────────────

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  try {
    await leadersRepo.deactivate(id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/leaders/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
