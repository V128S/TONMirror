import { NextResponse } from "next/server";

/**
 * POST /api/webhooks/ton
 * Skeleton for live TON event ingestion — disabled until NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 *
 * TODO (Phase 3): parse TON webhook payload, verify TON_WEBHOOK_SECRET,
 * normalize via TonWebhookTradeSource, and run DecisionService.
 */
export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") {
    return NextResponse.json(
      { error: "Live source is disabled. Set NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true to enable." },
      { status: 403 },
    );
  }

  // TODO(Phase 3): validate TON_WEBHOOK_SECRET header
  const secret  = req.headers.get("x-webhook-secret");
  const expected = process.env.TON_WEBHOOK_SECRET;
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO(Phase 3): parse body, normalize, call decisionService.processTradeEvent()
  return NextResponse.json({ data: { ok: true, note: "TODO: live source not yet implemented" } });
}
