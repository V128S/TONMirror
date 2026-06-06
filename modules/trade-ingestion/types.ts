/**
 * Core types for the trade-ingestion module.
 * Framework-agnostic — no Next.js / Prisma imports here.
 */

export interface NormalizedTradeEvent {
  /** Stable ID for deduplication — externalId from the source */
  id: string;
  externalId: string;
  /** DB id of the leader wallet */
  leaderWalletId: string;
  /** On-chain address of the leader */
  leaderAddress: string;
  txHash: string;
  timestamp: Date;
  soldToken: string;
  boughtToken: string;
  soldAmountDecimal: number;
  boughtAmountDecimal: number;
  usdEstimate?: number;
  dex: string;
  sourceProvider: "mock" | "ton_webhook";
  rawSourceJson: Record<string, unknown>;
}

/** Called for every new trade event emitted by a source */
export type TradeEventHandler = (event: NormalizedTradeEvent) => Promise<void>;

/** Adapter contract — implemented by Mock and Webhook sources */
export interface LeaderTradeSource {
  /** Start watching / polling */
  start(): Promise<void>;
  /** Stop and release resources */
  stop(): Promise<void>;
  /** Begin tracking a wallet */
  subscribeToWallet(address: string): Promise<void>;
  /** Stop tracking a wallet */
  unsubscribeFromWallet(address: string): Promise<void>;
  /** Pull recent trades for a wallet (used on demand). `limit` caps how many
   *  recent events to fetch — defaults to the ingestion window when omitted. */
  getRecentTrades(address: string, limit?: number): Promise<NormalizedTradeEvent[]>;
  /** Register a handler that receives new events */
  onTrade(handler: TradeEventHandler): void;
}
