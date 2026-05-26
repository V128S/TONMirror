import type { SwapEvent, WhaleScore } from "./types";

/** Composite score weights */
const WEIGHT_VOLUME   = 0.4;
const WEIGHT_WIN_RATE = 0.4;
const WEIGHT_ACTIVITY = 0.2;
/** Tag score thresholds */
const ALPHA_THRESHOLD    = 0.65;
const BALANCED_THRESHOLD = 0.4;
/** Profitability margin: swap is profitable if usdOut > usdIn * this */
const PROFIT_MARGIN    = 1.01;
/** High-volume cutoff in USD */
const HIGH_VOLUME_USD  = 100_000;
/** Window in days */
const WINDOW_DAYS = 30;

const THIRTY_DAYS_MS = WINDOW_DAYS * 24 * 60 * 60 * 1_000;
/** Max trades/day used for normalisation (1.0 at this value) */
const MAX_ACTIVITY_TRADES_PER_DAY = 10;
/** Reference volume for normalisation — wallets above this get vol_score = 1 */
const REFERENCE_VOLUME_USD = 500_000;

export function scoreWallet(
  address: string,
  swaps: SwapEvent[],
  now: number = Date.now(),
): WhaleScore {
  const recent = swaps.filter(s => now - s.timestamp.getTime() <= THIRTY_DAYS_MS);

  if (recent.length === 0) {
    return {
      address,
      volumeUsd30d:  0,
      winRate:       0,
      tradeCount30d: 0,
      activityScore: 0,
      score:         0,
      tags:          ["auto"],
      nickname:      shortAddress(address),
    };
  }

  // Volume score: logarithmic scale, clamped 0–1
  const volumeUsd30d  = recent.reduce((s, e) => s + e.usdIn, 0);
  const logVol        = Math.log10(Math.max(volumeUsd30d, 1));
  const logRef        = Math.log10(REFERENCE_VOLUME_USD);
  const volumeScore   = Math.min(1, logVol / logRef);

  // Win rate: profitable = usdOut > usdIn * PROFIT_MARGIN
  const withUsdOut    = recent.filter(e => e.usdOut > 0);
  const profitable    = withUsdOut.filter(e => e.usdOut > e.usdIn * PROFIT_MARGIN).length;
  const winRate       = withUsdOut.length > 0 ? profitable / withUsdOut.length : 0;

  // Activity score: trades per day over WINDOW_DAYS window, normalised
  const tradesPerDay  = recent.length / WINDOW_DAYS;
  const activityScore = Math.min(1, tradesPerDay / MAX_ACTIVITY_TRADES_PER_DAY);

  // Composite
  const score = volumeScore * WEIGHT_VOLUME + winRate * WEIGHT_WIN_RATE + activityScore * WEIGHT_ACTIVITY;

  // Tags
  const tags: string[] = ["auto"];
  if (score >= ALPHA_THRESHOLD)      tags.push("alpha");
  else if (score >= BALANCED_THRESHOLD)  tags.push("balanced");
  else                               tags.push("active");

  if (volumeUsd30d >= HIGH_VOLUME_USD) tags.push("high-volume");

  return {
    address,
    volumeUsd30d,
    winRate,
    tradeCount30d: recent.length,
    activityScore,
    score,
    tags,
    nickname: shortAddress(address),
  };
}

function shortAddress(addr: string): string {
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
