import { NextResponse } from "next/server";
import { z } from "zod";
import { executionService } from "@/server/services/execution.service";

const bodySchema = z.object({
  executionId: z.string().cuid(),
  quoteId:     z.string(),
});

/**
 * POST /api/execution/prepare
 * Builds a PreparedExecution for TON Connect signing.
 * Phase 2: returns stub. Phase 3: wires Omniston prepareExecution().
 */
export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    const prepared = await executionService.prepareExecution(parsed.data);
    return NextResponse.json({ data: prepared });
  } catch (err) {
    console.error("[POST /api/execution/prepare]", err);
    return NextResponse.json({ error: "Failed to prepare execution" }, { status: 500 });
  }
}
