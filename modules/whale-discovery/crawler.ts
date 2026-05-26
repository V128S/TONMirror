/**
 * WhaleCrawler — orchestrates the two-stage discovery pipeline.
 *
 * Stage 1: STON.fi top pools → collect wallet candidates (fast, no auth)
 * Stage 2: TonAPI per-wallet → score each candidate (slower, uses TON_API_KEY)
 *
 * Returns WhaleScore[] above the minScore threshold, sorted by score desc.
 */

import { getTopPools, getPoolSwappers }    from "./ston-fi-client";
import { batchGetWalletSwaps }             from "./tonapi-client";
import { scoreWallet }                     from "./scorer";
import type { WhaleScore }                 from "./types";

export interface CrawlerOptions {
  /** Minimum composite score to include in results. Default: 0.3 */
  minScore?:     number;
  /** Max wallets to process in Stage 2. Default: 50 */
  maxWallets?:   number;
  /** Number of top STON.fi pools to scan. Default: 5 */
  topPools?:     number;
  /** TonAPI bearer token. Without it, rate limit is 1 req/s. */
  tonApiKey?:    string;
  /** If true, skips DB upsert — for dry-run mode. */
  dryRun?:       boolean;
}

export async function runCrawler(options: CrawlerOptions = {}): Promise<WhaleScore[]> {
  const {
    minScore   = 0.3,
    maxWallets = 50,
    topPools   = 5,
    tonApiKey,
  } = options;

  console.log("[crawler] Stage 1: STON.fi top pools…");

  // ── Stage 1 ───────────────────────────────────────────────────────────────
  let poolAddresses: string[] = [];
  try {
    const pools  = await getTopPools(topPools);
    poolAddresses = pools.map(p => p.address).filter(Boolean);
    console.log(`[crawler] Stage 1: ${poolAddresses.length} pools found`);
  } catch (err) {
    console.error("[crawler] Stage 1 failed — STON.fi unavailable:", err);
    // Continue with empty pool list; Stage 2 will return nothing useful
    // but we don't crash the cron job
  }

  const candidates = await getPoolSwappers(poolAddresses, { tonApiKey });
  console.log(`[crawler] Stage 1: ${candidates.length} wallet candidates`);

  // ── Stage 2 ───────────────────────────────────────────────────────────────
  // Take top N candidates by raw volume
  const toScore = candidates.slice(0, maxWallets).map(c => c.address);
  console.log(`[crawler] Stage 2: scoring ${toScore.length} wallets via TonAPI…`);

  const swapsByWallet = await batchGetWalletSwaps(toScore, { tonApiKey });

  const scores: WhaleScore[] = [];
  for (const [address, swaps] of swapsByWallet.entries()) {
    const ws = scoreWallet(address, swaps);
    if (ws.score >= minScore) scores.push(ws);
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  console.log(`[crawler] Stage 2: ${scores.length} whales above threshold ${minScore}`);
  return scores;
}
