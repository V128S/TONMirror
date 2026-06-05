/**
 * GET|POST /api/cron/confirm-executions
 *
 * Resolves submitted executions to confirmed/failed by querying TonAPI for the
 * transaction that processed each signed message. Idempotent — safe to re-run.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>.
 *
 * Manual:
 *   curl -H "Authorization: Bearer dev_cron_secret" http://localhost:3000/api/cron/confirm-executions
 */
import { NextResponse, type NextRequest } from "next/server";
import { confirmationService } from "@/server/services/confirmation.service";
import { getServerEnv }        from "@/lib/env";

export const maxDuration = 300;

async function handle(req: NextRequest) {
  const env        = getServerEnv();
  const authHeader = req.headers.get("authorization") ?? "";
  const token      = authHeader.replace("Bearer ", "").trim();

  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await confirmationService.sweepPending();
    console.log("[cron/confirm-executions] completed:", result);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[cron/confirm-executions] error:", err);
    return NextResponse.json({ error: "Confirmation sweep failed" }, { status: 500 });
  }
}

export const GET  = handle;
export const POST = handle;
