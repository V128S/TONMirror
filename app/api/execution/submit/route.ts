import { NextResponse } from "next/server";
import { z } from "zod";
import { executionService } from "@/server/services/execution.service";

const bodySchema = z.object({
  executionId: z.string().cuid(),
  /**
   * Signed BoC returned by TON Connect sendTransaction().
   * TON Connect broadcasts the tx itself via the connected wallet app.
   * We store the BoC prefix as a reference — in production you'd poll
   * TonAPI GET /v2/blockchain/transactions to resolve the canonical txHash.
   */
  boc: z.string().min(1),
});

/**
 * POST /api/execution/submit
 *
 * Called by the client after TON Connect returns a signed BoC.
 * Updates the CopyExecution status to "submitted" and stores a BoC reference.
 *
 * The wallet app (Tonkeeper, MyTonWallet, etc.) is responsible for
 * broadcasting the transaction to the TON network — we don't need to
 * separately submit it here.
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

    const result = await executionService.submitExecution(
      parsed.data.executionId,
      parsed.data.boc,
    );

    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit execution";
    console.error("[POST /api/execution/submit]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
