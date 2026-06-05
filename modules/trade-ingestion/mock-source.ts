/**
 * MockLeaderTradeSource — deterministic, always-available trade source for demo mode.
 *
 * Emits time-based fake events covering TON, USDT, STON, NOT, DOGS tokens
 * across three quality tiers (alpha, degen, steady).
 *
 * No external calls — safe for demos with zero infra.
 */
import type {
  LeaderTradeSource,
  NormalizedTradeEvent,
  TradeEventHandler,
} from "./types";

// ─── Token sets ───────────────────────────────────────────────────────────────

const BASE_TOKENS   = new Set(["TON", "USDT", "USDC"]);

// ─── Template pool ────────────────────────────────────────────────────────────

type TradeTemplate = Omit<
  NormalizedTradeEvent,
  "id" | "externalId" | "leaderWalletId" | "leaderAddress" | "txHash" | "timestamp"
>;

const TEMPLATES: Record<string, TradeTemplate[]> = {
  alpha: [
    {
      soldToken:           "TON",
      boughtToken:         "USDT",
      soldAmountDecimal:   120,
      boughtAmountDecimal: 738.6,
      usdEstimate:         738.6,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "alpha", scenario: "profitable" },
    },
    {
      soldToken:           "USDT",
      boughtToken:         "STON",
      soldAmountDecimal:   500,
      boughtAmountDecimal: 14285,
      usdEstimate:         500,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "alpha", scenario: "buy_ston" },
    },
    {
      soldToken:           "STON",
      boughtToken:         "TON",
      soldAmountDecimal:   10000,
      boughtAmountDecimal: 350,
      usdEstimate:         2153,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "alpha", scenario: "sell_ston" },
    },
  ],
  degen: [
    {
      soldToken:           "TON",
      boughtToken:         "DOGS",
      soldAmountDecimal:   50,
      boughtAmountDecimal: 12_500_000,
      usdEstimate:         307.5,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "degen", scenario: "buy_dogs" },
    },
    {
      soldToken:           "TON",
      boughtToken:         "NOT",
      soldAmountDecimal:   30,
      boughtAmountDecimal: 85_000,
      usdEstimate:         184.5,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "degen", scenario: "buy_not" },
    },
    {
      soldToken:           "DOGS",
      boughtToken:         "TON",
      soldAmountDecimal:   5_000_000,
      boughtAmountDecimal: 18.5,
      usdEstimate:         113.85,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "degen", scenario: "sell_dogs" },
    },
  ],
  steady: [
    {
      soldToken:           "USDT",
      boughtToken:         "TON",
      soldAmountDecimal:   200,
      boughtAmountDecimal: 32.5,
      usdEstimate:         200,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "steady", scenario: "buy_ton" },
    },
    {
      soldToken:           "TON",
      boughtToken:         "USDT",
      soldAmountDecimal:   50,
      boughtAmountDecimal: 307.5,
      usdEstimate:         307.5,
      dex:                 "ston.fi",
      sourceProvider:      "mock",
      rawSourceJson:       { mock: true, tier: "steady", scenario: "sell_ton" },
    },
  ],
};

// ─── One-off scenario templates ───────────────────────────────────────────────

export const DEMO_SCENARIOS: Record<string, TradeTemplate> = {
  profitable: {
    soldToken:           "TON",
    boughtToken:         "USDT",
    soldAmountDecimal:   100,
    boughtAmountDecimal: 615,
    usdEstimate:         615,
    dex:                 "ston.fi",
    sourceProvider:      "mock",
    rawSourceJson:       { mock: true, scenario: "demo_profitable" },
  },
  risky: {
    soldToken:           "TON",
    boughtToken:         "NOT",
    soldAmountDecimal:   500,
    boughtAmountDecimal: 1_420_000,
    usdEstimate:         3075,
    dex:                 "ston.fi",
    sourceProvider:      "mock",
    rawSourceJson:       { mock: true, scenario: "demo_risky" },
  },
  blocked_token: {
    soldToken:           "TON",
    boughtToken:         "DOGS",
    soldAmountDecimal:   80,
    boughtAmountDecimal: 20_000_000,
    usdEstimate:         492,
    dex:                 "ston.fi",
    sourceProvider:      "mock",
    rawSourceJson:       { mock: true, scenario: "demo_blocked" },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Classify leader tier from address (deterministic, no crypto) */
function tierForAddress(address: string): "alpha" | "degen" | "steady" {
  if (address.includes("BFKB") || address.includes("FkBu")) return "alpha";
  if (address.includes("CbS3") || address.includes("bS3K")) return "degen";
  return "steady";
}

function makeId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildEvent(
  template: TradeTemplate,
  leaderWalletId: string,
  leaderAddress: string,
  externalId?: string,
): NormalizedTradeEvent {
  const eid = externalId ?? makeId();
  return {
    ...template,
    id:            eid,
    externalId:    eid,
    leaderWalletId,
    leaderAddress,
    txHash:        `0x${eid}`,
    timestamp:     new Date(),
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

export class MockLeaderTradeSource implements LeaderTradeSource {
  private handlers: TradeEventHandler[] = [];
  private wallets   = new Map<string, { id: string; tier: string }>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private tickMs: number;

  constructor(options: { tickMs?: number } = {}) {
    this.tickMs = options.tickMs ?? 15_000; // emit ~1 event/15 s in demo
  }

  onTrade(handler: TradeEventHandler): void {
    this.handlers.push(handler);
  }

  async start(): Promise<void> {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async subscribeToWallet(
    address: string,
    walletId = address,
  ): Promise<void> {
    const tier = tierForAddress(address);
    this.wallets.set(address, { id: walletId, tier });
  }

  async unsubscribeFromWallet(address: string): Promise<void> {
    this.wallets.delete(address);
  }

  async getRecentTrades(address: string): Promise<NormalizedTradeEvent[]> {
    const meta  = this.wallets.get(address);
    const tier  = meta?.tier ?? tierForAddress(address);
    const pool  = TEMPLATES[tier] ?? TEMPLATES.steady;
    const now   = Date.now();
    const hour  = 3_600_000;

    return pool.map((tpl, i) =>
      buildEvent(
        tpl,
        meta?.id ?? address,
        address,
        `mock_seed_${address.slice(-6)}_${i}`,
      ),
    ).map((evt, i) => ({
      ...evt,
      timestamp: new Date(now - (i + 1) * 2 * hour),
    }));
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private tick(): void {
    if (this.wallets.size === 0) return;
    // Pick a random wallet and emit one template event
    const entries = Array.from(this.wallets.entries());
    const [address, meta] = entries[Math.floor(Math.random() * entries.length)];
    const pool = TEMPLATES[meta.tier] ?? TEMPLATES.steady;
    const template = pool[Math.floor(Math.random() * pool.length)];
    const event = buildEvent(template, meta.id, address);

    for (const handler of this.handlers) {
      handler(event).catch((err) =>
        console.error("[MockLeaderTradeSource] handler error:", err),
      );
    }
  }
}

// ─── Helpers re-exported ─────────────────────────────────────────────────────

/** Returns true when the trade is a "sell" (leader exiting a position into base) */
export function isSellTrade(event: Pick<NormalizedTradeEvent, "soldToken" | "boughtToken">): boolean {
  return BASE_TOKENS.has(event.boughtToken) && !BASE_TOKENS.has(event.soldToken);
}
