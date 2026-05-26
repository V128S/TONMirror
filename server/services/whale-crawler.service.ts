/**
 * WhaleCrawlerService — orchestrates whale discovery and DB persistence.
 *
 * Calls the pure crawler module, then upserts results via leadersRepo.
 * Returns a CrawlerResult summary.
 */

import { runCrawler }   from "@/modules/whale-discovery/crawler";
import { leadersRepo }  from "@/server/repositories/leaders.repo";
import { getServerEnv } from "@/lib/env";
import type { CrawlerResult } from "@/modules/whale-discovery/types";

export const whaleCrawlerService = {
  async runDiscovery(options?: { dryRun?: boolean }): Promise<CrawlerResult> {
    const start   = Date.now();
    const env     = getServerEnv();
    const dryRun  = options?.dryRun ?? false;

    let whales;
    try {
      whales = await runCrawler({
        minScore:   env.WHALE_MIN_SCORE,
        maxWallets: env.WHALE_MAX_LEADERS,
        tonApiKey:  env.TON_API_KEY,
        dryRun,
      });
    } catch (err) {
      console.error("[whale-crawler.service] Crawler failed:", err);
      return { discovered: 0, updated: 0, skipped: 0, durationMs: Date.now() - start };
    }

    if (dryRun) {
      return {
        discovered: whales.length,
        updated:    0,
        skipped:    0,
        durationMs: Date.now() - start,
      };
    }

    let discovered = 0;
    let updated    = 0;
    let skipped    = 0;

    for (const whale of whales.slice(0, env.WHALE_MAX_LEADERS)) {
      try {
        const existing = await leadersRepo.findByAddress(whale.address);
        await leadersRepo.upsertFromCrawler(whale);
        if (existing) updated++;
        else          discovered++;
      } catch (err) {
        console.error(`[whale-crawler.service] upsert failed for ${whale.address}:`, err);
        skipped++;
      }
    }

    return { discovered, updated, skipped, durationMs: Date.now() - start };
  },
};
