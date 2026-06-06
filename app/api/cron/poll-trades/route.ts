/**
 * GET|POST /api/cron/poll-trades
 *
 * The automatic copy-trade loop. Polls recent trades for every actively-followed
 * leader and runs the decision pipeline. Idempotent — safe to call repeatedly.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>. Vercel injects this header
 * for scheduled cron invocations; external schedulers must send it too.
 *
 * Manual:
 *   curl -H "Authorization: Bearer dev_cron_secret" http://localhost:3000/api/cron/poll-trades
 *
 * Note: Vercel Hobby crons run daily only. For real-time copy-trading use Vercel
 * Pro (per-minute crons) or an external scheduler (cron-job.org / QStash) hitting
 * this endpoint every 1–2 min with the CRON_SECRET.
 */
import { NextResponse, type NextRequest, after } from "next/server";
import { ingestionService } from "@/server/services/ingestion.service";
import { getServerEnv }     from "@/lib/env";

export const maxDuration = 300; // Vercel: up to 300s

async function handle(req: NextRequest) {
  const env        = getServerEnv();
  const authHeader = req.headers.get("authorization") ?? "";
  const token      = authHeader.replace("Bearer ", "").trim();

  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Polling all leaders hits TonAPI/Omniston and can take ~30s+, which exceeds an
  // external scheduler's request timeout (cron-job.org ~30s). Acknowledge
  // immediately and run the (idempotent) poll in the background via after() — the
  // Vercel function stays alive until it finishes (up to maxDuration). Results
  // and errors go to the logs + AuditLog, not the HTTP response.
  after(async () => {
    try {
      const result = await ingestionService.pollAllLeaders();
      console.log("[cron/poll-trades] completed:", result);
    } catch (err) {
      console.error("[cron/poll-trades] error:", err);
    }
  });

  return NextResponse.json({ data: { accepted: true } }, { status: 202 });
}

export const GET  = handle;
export const POST = handle;
