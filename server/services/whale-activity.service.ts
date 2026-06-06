/**
 * Whale-activity service — surfaces a leader wallet's recent on-chain swaps and
 * period statistics for the Discover/whale detail view.
 *
 * Unlike the activity feed (which is scoped to the user's own copies), this
 * shows the *whale's* public trading activity regardless of follow status, so a
 * user can size up a leader before mirroring them. Data comes from the active
 * trade source (`getTradeSource()`) — live TonAPI when enabled, deterministic
 * mock otherwise — so the same code path works in demo and production.
 *
 * Never throws — returns an empty window on any source error so the UI degrades
 * to an empty state instead of crashing.
 */
import { getTradeSource } from "@/modules/trade-ingestion";
import type { NormalizedTradeEvent } from "@/modules/trade-ingestion/types";
import { leadersRepo } from "@/server/repositories/leaders.repo";

export type WhalePeriod = "day" | "week" | "month";

const PERIOD_MS: Record<WhalePeriod, number> = {
  day:   24 * 3_600_000,
  week:  7 * 24 * 3_600_000,
  month: 30 * 24 * 3_600_000,
};

/** How many recent events to pull from the source before filtering by window.
 *  TonAPI caps a single request at 100; a wider window is best-effort. */
const FETCH_LIMIT = 100;

export type WhaleTradeDirection = "buy" | "sell" | "swap";

export interface WhaleTrade {
  id:                  string;
  txHash:              string;
  timestamp:           string; // ISO
  soldToken:           string;
  boughtToken:         string;
  soldAmountDecimal:   number;
  boughtAmountDecimal: number;
  usdEstimate:         number | null;
  dex:                 string;
  direction:           WhaleTradeDirection;
}

export interface WhaleActivityStats {
  tradeCount:   number;
  volumeUsd:    number;
  avgSizeUsd:   number | null;
  buys:         number;
  sells:        number;
  /** USD spent acquiring tokens (TON-leg of buys) within the window. */
  boughtUsd:    number;
  /** USD realised selling tokens back to TON (TON-leg of sells) within window. */
  soldUsd:      number;
  /** Realised net flow: soldUsd − boughtUsd. Positive = net cash out (took
   *  profit/distributed), negative = net accumulation. Best-effort PnL proxy
   *  from one-directional swaps — excludes token↔token legs we can't price. */
  netPnlUsd:    number;
  /** netPnlUsd / boughtUsd as a ratio (e.g. 0.12 = +12%), null when no buys. */
  roi:          number | null;
  lastActiveAt: string | null; // ISO of most recent trade in window
}

export interface WhaleActivity {
  period: WhalePeriod;
  trades: WhaleTrade[];
  stats:  WhaleActivityStats;
}

/** Classify a swap relative to TON: spending TON → buy, receiving TON → sell. */
function classifyDirection(soldToken: string, boughtToken: string): WhaleTradeDirection {
  if (soldToken === "TON")   return "buy";
  if (boughtToken === "TON") return "sell";
  return "swap";
}

export const whaleActivityService = {
  /**
   * Returns the whale's swaps within `period` plus aggregate stats.
   * Returns null only when the leader id is unknown.
   */
  async getForLeader(leaderId: string, period: WhalePeriod): Promise<WhaleActivity | null> {
    const leader = await leadersRepo.findById(leaderId);
    if (!leader) return null;

    let raw: NormalizedTradeEvent[];
    try {
      const source = await getTradeSource();
      raw = await source.getRecentTrades(leader.address, FETCH_LIMIT);
    } catch (err) {
      console.warn("[whaleActivityService] source error:", err);
      raw = [];
    }

    const sinceMs = Date.now() - PERIOD_MS[period];
    const inWindow = raw
      .filter((e) => e.timestamp.getTime() >= sinceMs)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const trades: WhaleTrade[] = inWindow.map((e) => ({
      id:                  e.externalId,
      txHash:              e.txHash,
      timestamp:           e.timestamp.toISOString(),
      soldToken:           e.soldToken,
      boughtToken:         e.boughtToken,
      soldAmountDecimal:   e.soldAmountDecimal,
      boughtAmountDecimal: e.boughtAmountDecimal,
      usdEstimate:         e.usdEstimate ?? null,
      dex:                 e.dex,
      direction:           classifyDirection(e.soldToken, e.boughtToken),
    }));

    const volumeUsd = trades.reduce((s, t) => s + (t.usdEstimate ?? 0), 0);
    const pricedCount = trades.filter((t) => t.usdEstimate != null).length;
    const buyTrades  = trades.filter((t) => t.direction === "buy");
    const sellTrades = trades.filter((t) => t.direction === "sell");

    const boughtUsd = buyTrades.reduce((s, t) => s + (t.usdEstimate ?? 0), 0);
    const soldUsd   = sellTrades.reduce((s, t) => s + (t.usdEstimate ?? 0), 0);
    const netPnlUsd = soldUsd - boughtUsd;

    const stats: WhaleActivityStats = {
      tradeCount:   trades.length,
      volumeUsd,
      avgSizeUsd:   pricedCount > 0 ? volumeUsd / pricedCount : null,
      buys:         buyTrades.length,
      sells:        sellTrades.length,
      boughtUsd,
      soldUsd,
      netPnlUsd,
      roi:          boughtUsd > 0 ? netPnlUsd / boughtUsd : null,
      lastActiveAt: trades[0]?.timestamp ?? null,
    };

    return { period, trades, stats };
  },
};
