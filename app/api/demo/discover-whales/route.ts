/**
 * POST /api/demo/discover-whales
 *
 * Manual trigger for the whale scanner (no auth, for demo purposes).
 * Supports dryRun: true — returns discovered whales without writing to DB.
 */

import { NextResponse, type NextRequest } from "next/server";
import { z }                              from "zod";
import { whaleCrawlerService }            from "@/server/services/whale-crawler.service";
import { runCrawler }                     from "@/modules/whale-discovery/crawler";
import { getServerEnv }                   from "@/lib/env";

const bodySchema = z.object({
  dryRun: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const dryRun = parsed.success ? parsed.data.dryRun : false;

  try {
    const env    = getServerEnv();
    const result = await whaleCrawlerService.runDiscovery({ dryRun });

    // For dry-run, also return the raw whale list for preview
    if (dryRun) {
      const whales = await runCrawler({
        minScore:   env.WHALE_MIN_SCORE,
        maxWallets: env.WHALE_MAX_LEADERS,
        tonApiKey:  env.TON_API_KEY,
      });
      return NextResponse.json({ data: { result, whales } });
    }

    return NextResponse.json({ data: { result } });
  } catch (err) {
    console.error("[demo/discover-whales]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
