import type { SwapEvent, WhaleScore } from "./types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1_000;
/** Max trades/day used for normalisation (1.0 at this value) */
const MAX_ACTIVITY_TRADES_PER_DAY = 10;
/** Reference volume for normalisation — wallets above this get vol_score = 1 */
const REFERENCE_VOLUME_USD = 500_000;

export function scoreWallet(address: string, swaps: SwapEvent[]): WhaleScore {
  const now = Date.now();
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

  // Win rate: profitable = usdOut > usdIn * 1.01
  const withUsdOut    = recent.filter(e => e.usdOut > 0);
  const profitable    = withUsdOut.filter(e => e.usdOut > e.usdIn * 1.01).length;
  const winRate       = withUsdOut.length > 0 ? profitable / withUsdOut.length : 0.5;

  // Activity score: trades per day over 30d window, normalised
  const tradesPerDay  = recent.length / 30;
  const activityScore = Math.min(1, tradesPerDay / MAX_ACTIVITY_TRADES_PER_DAY);

  // Composite
  const score = volumeScore * 0.4 + winRate * 0.4 + activityScore * 0.2;

  // Tags
  const tags: string[] = ["auto"];
  if (score >= 0.65)      tags.push("alpha");
  else if (score >= 0.4)  tags.push("balanced");
  else                    tags.push("active");

  if (volumeUsd30d >= 100_000) tags.push("high-volume");

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
