/**
 * Unit tests for modules/trade-ingestion/ton-payload-parser.ts
 *
 * Tests the parser in complete isolation: no DB, no network, no Next.js.
 */
import { describe, it, expect } from "vitest";
import {
  extractSwap,
  parseTonWebhookPayload,
  TonWebhookPayloadSchema,
} from "@/modules/trade-ingestion/ton-payload-parser";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const LEADER_WALLET_ID = "claaaaaaaaaaaaaaaaaaaaaa";

/** Well-formed TonAPI v2 JettonSwap payload (TON → USDT) */
const VALID_SWAP_TON_TO_USDT = {
  event_id:  "evt_abc123",
  timestamp: 1716670000,
  account: { address: "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL" },
  actions: [
    {
      type:   "JettonSwap",
      status: "ok",
      jetton_swap: {
        dex:               "stonfi",
        amount_in:         "10000000000",   // 10 TON (9 decimals)
        amount_out:        "61500000",      // 61.5 USDT (6 decimals)
        ton_in:            "10000000000",
        ton_out:           null,
        user_wallet:       "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL",
        jetton_master_in:  null,           // null = TON sold
        jetton_master_out: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", // USDT (verified)
        router:            "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt",
      },
    },
  ],
};

/** Swap where a failed action precedes a successful one */
const SWAP_WITH_FAILED_ACTION_FIRST = {
  ...VALID_SWAP_TON_TO_USDT,
  actions: [
    {
      type:   "JettonSwap",
      status: "failed",
      jetton_swap: {
        dex: "stonfi",
        amount_in: "1000000000", amount_out: "0",
        ton_in: null, ton_out: null,
        user_wallet: "UQBFk…",
        jetton_master_in: null, jetton_master_out: null,
      },
    },
    ...VALID_SWAP_TON_TO_USDT.actions,
  ],
};

/** Payload with no swap actions at all */
const NON_SWAP_PAYLOAD = {
  event_id:  "evt_transfer",
  timestamp: 1716670000,
  account: { address: "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL" },
  actions: [
    { type: "TonTransfer", status: "ok" },
  ],
};

/** Self-swap (same token in/out — should be skipped) */
const SELF_SWAP = {
  ...VALID_SWAP_TON_TO_USDT,
  actions: [
    {
      type:   "JettonSwap",
      status: "ok",
      jetton_swap: {
        dex: "stonfi",
        amount_in:  "1000000000",
        amount_out: "1000000000",
        ton_in: "1000000000",
        ton_out: null,
        user_wallet: "UQBFk…",
        jetton_master_in:  null,
        jetton_master_out: null,   // both null → both = "TON" = self-swap
      },
    },
  ],
};

// ─── Schema validation ────────────────────────────────────────────────────────

describe("TonWebhookPayloadSchema", () => {
  it("accepts a valid TonAPI payload", () => {
    const result = TonWebhookPayloadSchema.safeParse(VALID_SWAP_TON_TO_USDT);
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing event_id", () => {
    const { event_id: _, ...bad } = VALID_SWAP_TON_TO_USDT;
    const result = TonWebhookPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects a payload with non-integer timestamp", () => {
    const bad = { ...VALID_SWAP_TON_TO_USDT, timestamp: "not-a-number" };
    const result = TonWebhookPayloadSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

// ─── extractSwap ──────────────────────────────────────────────────────────────

describe("extractSwap", () => {
  it("returns swap data for a valid TON→USDT event", () => {
    const payload = TonWebhookPayloadSchema.parse(VALID_SWAP_TON_TO_USDT);
    const swap = extractSwap(payload);

    expect(swap).not.toBeNull();
    expect(swap!.soldToken).toBe("TON");
    expect(swap!.boughtToken).toBe("USDT");
    expect(swap!.soldAmountDecimal).toBeCloseTo(10, 2);
    expect(swap!.boughtAmountDecimal).toBeCloseTo(61.5, 2); // 61500000 @ 6 decimals
    expect(swap!.dex).toBe("stonfi");
  });

  it("skips failed actions and finds the successful one", () => {
    const payload = TonWebhookPayloadSchema.parse(SWAP_WITH_FAILED_ACTION_FIRST);
    const swap = extractSwap(payload);
    expect(swap).not.toBeNull();
    expect(swap!.soldToken).toBe("TON");
  });

  it("returns null for a non-swap payload", () => {
    const payload = TonWebhookPayloadSchema.parse(NON_SWAP_PAYLOAD);
    const swap = extractSwap(payload);
    expect(swap).toBeNull();
  });

  it("returns null for a self-swap (same token in/out)", () => {
    const payload = TonWebhookPayloadSchema.parse(SELF_SWAP);
    const swap = extractSwap(payload);
    expect(swap).toBeNull();
  });

  it("includes a USD estimate when TON is involved", () => {
    const payload = TonWebhookPayloadSchema.parse(VALID_SWAP_TON_TO_USDT);
    const swap = extractSwap(payload);
    expect(swap!.usdEstimate).toBeGreaterThan(0);
  });
});

// ─── parseTonWebhookPayload ───────────────────────────────────────────────────

describe("parseTonWebhookPayload", () => {
  it("returns a NormalizedTradeEvent on a valid swap payload", () => {
    const event = parseTonWebhookPayload(VALID_SWAP_TON_TO_USDT, LEADER_WALLET_ID);

    expect(event).not.toBeNull();
    expect(event!.externalId).toBe("evt_abc123");
    expect(event!.leaderWalletId).toBe(LEADER_WALLET_ID);
    expect(event!.sourceProvider).toBe("ton_webhook");
    expect(event!.soldToken).toBe("TON");
    expect(event!.boughtToken).toBe("USDT");
    expect(event!.timestamp).toBeInstanceOf(Date);
  });

  it("returns null for a non-swap payload", () => {
    const event = parseTonWebhookPayload(NON_SWAP_PAYLOAD, LEADER_WALLET_ID);
    expect(event).toBeNull();
  });

  it("returns null for completely malformed input", () => {
    expect(parseTonWebhookPayload(null,              LEADER_WALLET_ID)).toBeNull();
    expect(parseTonWebhookPayload("not an object",   LEADER_WALLET_ID)).toBeNull();
    expect(parseTonWebhookPayload({ foo: "bar" },    LEADER_WALLET_ID)).toBeNull();
  });

  it("correctly converts timestamp to a Date object", () => {
    const event = parseTonWebhookPayload(VALID_SWAP_TON_TO_USDT, LEADER_WALLET_ID);
    expect(event!.timestamp.getTime()).toBe(1716670000 * 1000);
  });
});
