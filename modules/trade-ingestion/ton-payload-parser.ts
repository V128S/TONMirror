/**
 * TonPayloadParser — normalizes raw TON indexer webhook payloads.
 *
 * Supported schema: TonAPI v2 account-event webhook
 * (https://docs.tonconsole.com/tonapi/webhook).
 *
 * Only JettonSwap and Ton-to-Jetton swap actions are extracted.
 * Any non-swap payload returns null — callers must handle gracefully.
 *
 * This module is framework-agnostic: no Next.js / Prisma imports.
 */

import { z } from "zod";
import type { NormalizedTradeEvent } from "./types";

// ─── Raw payload schema (TonAPI v2 account-event) ─────────────────────────────

const AddressSchema = z.object({
  address: z.string(),
  name:    z.string().optional(),
});

const JettonSwapSchema = z.object({
  dex:              z.string(),                 // e.g. "stonfi", "dedust"
  amount_in:        z.string(),                 // nanotons or jetton base units
  amount_out:       z.string(),
  ton_in:           z.string().nullable(),      // set if selling TON
  ton_out:          z.string().nullable(),      // set if buying TON
  user_wallet:      z.string(),
  jetton_master_in:  z.string().nullable(),     // null means TON was sold
  jetton_master_out: z.string().nullable(),     // null means TON is received
  router:           z.string().optional(),
});

const ActionSchema = z.object({
  type:   z.string(),
  status: z.string(),                           // "ok" | "failed"
  jetton_swap: JettonSwapSchema.optional(),
});

export const TonWebhookPayloadSchema = z.object({
  event_id:  z.string(),
  timestamp: z.number().int(),
  account:   AddressSchema,
  actions:   z.array(ActionSchema),
});

export type TonWebhookPayload = z.infer<typeof TonWebhookPayloadSchema>;

// ─── Token resolution helpers ─────────────────────────────────────────────────

/** Jetton master address → symbol mapping (mirrors TOKEN_MAP in omniston module) */
const JETTON_SYMBOL: Record<string, string> = {
  "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA": "USDT",
  "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO": "STON",
  "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT": "NOT",
  "EQCvxJy4eG8hyHl7jaWwFkPaK8LejS2MCft9tnQ8ohtXu_DOGS": "DOGS",
};

const TON_DECIMALS     = 9;
const DEFAULT_DECIMALS = 9;

function resolveToken(jettonMaster: string | null): string {
  if (!jettonMaster) return "TON";
  return JETTON_SYMBOL[jettonMaster] ?? jettonMaster.slice(0, 8) + "…";
}

function toDecimal(units: string, decimals = DEFAULT_DECIMALS): number {
  // Use floating-point division; safe for amounts up to ~10^15 nanotons
  // (well within JS Number precision for typical swap sizes).
  const n = parseFloat(units);
  return n / Math.pow(10, decimals);
}

// ─── Parser ───────────────────────────────────────────────────────────────────

export interface ParsedSwap {
  soldToken:           string;
  boughtToken:         string;
  soldAmountDecimal:   number;
  boughtAmountDecimal: number;
  usdEstimate?:        number;
  dex:                 string;
}

/**
 * Extract the first successful JettonSwap from a TonAPI webhook event.
 * Returns null if the payload contains no actionable swap.
 */
export function extractSwap(payload: TonWebhookPayload): ParsedSwap | null {
  for (const action of payload.actions) {
    if (action.type !== "JettonSwap") continue;
    if (action.status !== "ok")       continue;
    if (!action.jetton_swap)          continue;

    const swap = action.jetton_swap;

    const soldToken   = resolveToken(swap.jetton_master_in);
    const boughtToken = resolveToken(swap.jetton_master_out);

    // Skip self-swaps (shouldn't happen, but guard anyway)
    if (soldToken === boughtToken) continue;

    const soldDecimals   = soldToken   === "TON" ? TON_DECIMALS : DEFAULT_DECIMALS;
    const boughtDecimals = boughtToken === "TON" ? TON_DECIMALS : DEFAULT_DECIMALS;

    const soldAmountDecimal   = toDecimal(swap.amount_in,  soldDecimals);
    const boughtAmountDecimal = toDecimal(swap.amount_out, boughtDecimals);

    // Rough USD estimate: if TON is involved use 6 USD/TON placeholder
    // (real impl would use price feed; this avoids a network call)
    const TON_USD_APPROX = 6;
    const usdEstimate =
      soldToken   === "TON" ? soldAmountDecimal   * TON_USD_APPROX :
      boughtToken === "TON" ? boughtAmountDecimal * TON_USD_APPROX :
      undefined;

    return {
      soldToken,
      boughtToken,
      soldAmountDecimal,
      boughtAmountDecimal,
      usdEstimate,
      dex: swap.dex,
    };
  }

  return null;
}

/**
 * Full parse: validate schema + extract swap + build NormalizedTradeEvent fields.
 * Returns null on any failure (bad schema, no swap action, failed action).
 *
 * Caller is responsible for supplying leaderWalletId (DB lookup).
 */
export function parseTonWebhookPayload(
  raw: unknown,
  leaderWalletId: string,
): Omit<NormalizedTradeEvent, "id"> | null {
  const parsed = TonWebhookPayloadSchema.safeParse(raw);
  if (!parsed.success) return null;

  const payload = parsed.data;
  const swap    = extractSwap(payload);
  if (!swap) return null;

  return {
    externalId:          payload.event_id,
    leaderWalletId,
    leaderAddress:       payload.account.address,
    txHash:              payload.event_id,              // TonAPI event_id doubles as ref
    timestamp:           new Date(payload.timestamp * 1000),
    soldToken:           swap.soldToken,
    boughtToken:         swap.boughtToken,
    soldAmountDecimal:   swap.soldAmountDecimal,
    boughtAmountDecimal: swap.boughtAmountDecimal,
    usdEstimate:         swap.usdEstimate,
    dex:                 swap.dex,
    sourceProvider:      "ton_webhook",
    rawSourceJson:       raw as Record<string, unknown>,
  };
}
