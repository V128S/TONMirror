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
import { NextResponse, type NextRequest } from "next/server";
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

  try {
    const result = await ingestionService.pollAllLeaders();
    console.log("[cron/poll-trades] completed:", result);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[cron/poll-trades] error:", err);
    return NextResponse.json({ error: "Ingestion failed" }, { status: 500 });
  }
}

export const GET  = handle;
export const POST = handle;
