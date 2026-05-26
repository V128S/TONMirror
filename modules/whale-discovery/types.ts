/** A raw swap event as returned by TonAPI, normalised to our domain shape. */
export interface SwapEvent {
  txHash:      string;
  timestamp:   Date;
  soldToken:   string;
  boughtToken: string;
  usdIn:       number;   // USD value spent
  usdOut:      number;   // USD value received (0 if unknown)
  dex:         string;
}

/** Stage 1 output — wallet seen in a top pool, with raw 24h volume. */
export interface WalletCandidate {
  address:      string;
  rawVolumeUsd: number;
  swapCount:    number;
}

/** Stage 2 output — fully scored wallet ready for DB upsert. */
export interface WhaleScore {
  address:       string;
  volumeUsd30d:  number;
  winRate:       number;    // 0–1
  tradeCount30d: number;
  activityScore: number;    // 0–1  (trades/day normalised to 10/day = 1.0)
  score:         number;    // composite 0–1
  tags:          string[];  // ["auto", "alpha"|"balanced"|"active"]
  nickname:      string;    // short address, e.g. "UQBFk…3RX"
}

/** Returned by WhaleCrawlerService.runDiscovery() */
export interface CrawlerResult {
  discovered:  number;   // new leaders added
  updated:     number;   // existing leaders refreshed
  skipped:     number;   // below threshold
  durationMs:  number;
}
