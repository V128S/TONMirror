/**
 * GET /api/cron/discover-whales
 *
 * Called by Vercel Cron every 6 hours.
 * Protected by Authorization: Bearer <CRON_SECRET>.
 *
 * Vercel automatically injects this header when invoking cron jobs.
 * Manual curl: curl -H "Authorization: Bearer dev_cron_secret" http://localhost:3000/api/cron/discover-whales
 */

import { NextResponse, type NextRequest } from "next/server";
import { whaleCrawlerService } from "@/server/services/whale-crawler.service";
import { getServerEnv }        from "@/lib/env";

export const maxDuration = 300; // Vercel: up to 300s

export async function GET(req: NextRequest) {
  const env    = getServerEnv();
  const authHeader = req.headers.get("authorization") ?? "";
  const token  = authHeader.replace("Bearer ", "").trim();

  if (token !== env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await whaleCrawlerService.runDiscovery();
    console.log("[cron/discover-whales] completed:", result);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[cron/discover-whales] error:", err);
    return NextResponse.json({ error: "Crawler failed" }, { status: 500 });
  }
}
