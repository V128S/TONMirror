/**
 * POST /api/webhooks/ton
 *
 * Receives push events from a TON indexer (TonAPI / Toncenter).
 * Disabled unless NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 *
 * Security
 * ────────
 * The indexer must include the shared secret in the
 * `X-Webhook-Secret` header.  We compare with a constant-time
 * helper to prevent timing attacks.
 *
 * Flow
 * ────
 * 1. Gate: live source must be enabled
 * 2. Verify X-Webhook-Secret header
 * 3. Parse body (Zod validates inside parseTonWebhookPayload)
 * 4. Resolve leader wallet from account address
 * 5. Normalise via parseTonWebhookPayload()
 * 6. Run DecisionService pipeline
 * 7. Return { ok: true, processed: bool }
 */

import { NextResponse } from "next/server";
import { decisionService } from "@/server/services/decision.service";
import { parseTonWebhookPayload } from "@/modules/trade-ingestion/ton-payload-parser";
import { leadersRepo } from "@/server/repositories/leaders.repo";

// ─── Constant-time string comparison (timing-safe) ────────────────────────────

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // ── Gate ────────────────────────────────────────────────────────────────────
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") {
    return NextResponse.json(
      { error: "Live source is disabled. Set NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true to enable." },
      { status: 403 },
    );
  }

  // ── Auth ────────────────────────────────────────────────────────────────────
  const incomingSecret = req.headers.get("x-webhook-secret") ?? "";
  const expectedSecret = process.env.TON_WEBHOOK_SECRET ?? "";

  if (!expectedSecret) {
    console.error("[TON webhook] TON_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!safeEqual(incomingSecret, expectedSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse ────────────────────────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Resolve leader wallet ID ─────────────────────────────────────────────────
  const accountAddress =
    typeof raw === "object" && raw !== null
      ? ((raw as Record<string, unknown>).account as Record<string, unknown> | undefined)
          ?.address as string | undefined
      : undefined;

  if (!accountAddress) {
    return NextResponse.json(
      { error: "Payload missing account.address" },
      { status: 422 },
    );
  }

  const leader = await leadersRepo.findByAddress(accountAddress).catch(() => null);

  if (!leader) {
    // Not a tracked leader — accept silently (common during initial setup)
    return NextResponse.json({
      data: { ok: true, processed: false, reason: "unknown_wallet" },
    });
  }

  // ── Normalise ────────────────────────────────────────────────────────────────
  const normalized = parseTonWebhookPayload(raw, leader.id);

  if (!normalized) {
    console.log("[TON webhook] Skipping non-swap event for", accountAddress);
    return NextResponse.json({
      data: { ok: true, processed: false, reason: "not_a_swap" },
    });
  }

  const event = { id: normalized.externalId, ...normalized };

  // ── Decision pipeline ────────────────────────────────────────────────────────
  try {
    await decisionService.processTradeEvent(event);
  } catch (err) {
    // Always return 200 so the indexer does not retry (retries → duplicate executions).
    console.error("[TON webhook] processTradeEvent error:", err);
    return NextResponse.json({
      data: { ok: true, processed: false, reason: "pipeline_error" },
    });
  }

  return NextResponse.json({ data: { ok: true, processed: true } });
}
