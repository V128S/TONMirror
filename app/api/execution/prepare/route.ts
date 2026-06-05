import { NextResponse } from "next/server";
import { z } from "zod";
import { executionService } from "@/server/services/execution.service";
import { requireExecutionAccess } from "@/server/auth/require-execution-access";

const bodySchema = z.object({
  executionId:    z.string().cuid(),
  quoteId:        z.string(),
  /** Connected wallet address — required for live Omniston; optional in demo mode */
  walletAddress:  z.string().optional(),
});

/**
 * POST /api/execution/prepare
 * Builds a PreparedTransaction (messages) for TON Connect signing.
 *
 * Uses real Omniston tonBuildSwap when NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true, and
 * requires walletAddress in that case (live swaps build for a concrete wallet).
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

    const access = await requireExecutionAccess(req, parsed.data.executionId);
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    // Live swaps must be built for a concrete wallet; demo/mock does not need one.
    if (
      process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true" &&
      !parsed.data.walletAddress
    ) {
      return NextResponse.json(
        { error: "walletAddress is required when the live source is enabled" },
        { status: 422 },
      );
    }

    const prepared = await executionService.prepareExecution(parsed.data);
    return NextResponse.json({ data: prepared });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to prepare execution";
    console.error("[POST /api/execution/prepare]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
