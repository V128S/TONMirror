import { NextResponse } from "next/server";
import { z } from "zod";
import { executionService } from "@/server/services/execution.service";
import { requireExecutionAccess } from "@/server/auth/require-execution-access";

const bodySchema = z.object({
  executionId: z.string().cuid(),
  soldToken:   z.string(),
  boughtToken: z.string(),
  amountIn:    z.number().positive(),
  slippageBps: z.number().int().min(0).max(10000).default(100),
});

/**
 * POST /api/execution/quote
 * Fetches a quote for an execution.
 * Phase 2: returns stub quote.
 * Phase 3: wires OmnistonQuoteProvider.
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

    const quote = await executionService.fetchQuote(parsed.data);
    return NextResponse.json({ data: quote });
  } catch (err) {
    // Front-load the message so it's visible in truncated log views.
    const msg = err instanceof Error ? `${err.message}` : String(err);
    console.error(`[quote-fail] ${msg}`);
    return NextResponse.json({ error: "Failed to fetch quote", detail: msg }, { status: 500 });
  }
}
