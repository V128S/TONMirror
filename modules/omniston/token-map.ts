/**
 * Maps TonMirror token symbols to Omniston SDK AssetId types and decimals.
 *
 * This is the *live* token universe — the set of tokens TonMirror can actually
 * quote and execute on-chain. We deliberately track only a small, vetted set of
 * pairs (see SUPPORTED_PAIRS) rather than arbitrary jettons: copying an unknown
 * whale token risks honeypots, wrong decimals, and unroutable swaps.
 *
 * ⚠️ Addresses below are mainnet jetton masters and MUST be verified against the
 * live contracts before real funds flow. Demo mode never uses this map (it uses
 * modules/omniston/mock-provider MOCK_RATES instead).
 */
import type { AssetId } from "@ston-fi/omniston-sdk";

export type TokenInfo = {
  assetId: AssetId;
  decimals: number;
  address?: string;
};

/** Omniston AssetId for TON (native) */
const TON_NATIVE_ASSET: AssetId = {
  chain: { $case: "ton", value: { kind: { $case: "native", value: {} } } },
};

/** Build a TON jetton AssetId from a contract address */
function jetton(address: string): AssetId {
  return { chain: { $case: "ton", value: { kind: { $case: "jetton", value: address } } } };
}

export const TOKEN_MAP: Record<string, TokenInfo> = {
  TON: {
    assetId:  TON_NATIVE_ASSET,
    decimals: 9,
  },
  // Tether USD₮ on TON (jetton master)
  USDT: {
    assetId:  jetton("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"),
    decimals: 6,
    address:  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  },
  // Tonstakers staked TON (tsTON) — jetton master
  TSTON: {
    assetId:  jetton("EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav"),
    decimals: 9,
    address:  "EQC98_qAmNEptUtPc7W6xdHh_ZHrBUFpw5Ft_IzNU20QAJav",
  },
};

/**
 * The only token pairs TonMirror copies on the live path, as directed
 * `SOLD>BOUGHT` keys (uppercased). Anything outside this set is ignored by the
 * ingestion loop so we never build a swap for an unvetted/unroutable token.
 */
export const SUPPORTED_PAIRS: ReadonlySet<string> = new Set([
  "TON>USDT",
  "USDT>TON",
  "TSTON>USDT",
]);

/** Normalize a source token symbol to the canonical TOKEN_MAP key. */
function canonicalSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/**
 * True when (soldToken → boughtToken) is a directed pair we support on the live
 * path. Case-insensitive; `tsTON` and `TSTON` both resolve to the same key.
 */
export function isSupportedPair(soldToken: string, boughtToken: string): boolean {
  return SUPPORTED_PAIRS.has(`${canonicalSymbol(soldToken)}>${canonicalSymbol(boughtToken)}`);
}

/**
 * Convert a decimal amount to integer base units (string).
 *
 * Uses string parsing rather than float math so amounts like 1.234567891 TON
 * (9 decimals) don't drift through `Number` rounding before they become an
 * on-chain amount.
 */
export function toBaseUnits(decimal: number, decimals: number): string {
  if (!Number.isFinite(decimal) || decimal < 0) return "0";

  // Render without exponent notation, then split on the decimal point.
  const fixed = decimal.toFixed(decimals);
  const [whole, frac = ""] = fixed.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  const digits = `${whole}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return BigInt(digits === "" ? "0" : digits).toString();
}

/** Convert base units (integer string) to decimal */
export function fromBaseUnits(baseUnits: string, decimals: number): number {
  const factor = 10 ** decimals;
  return Number(baseUnits) / factor;
}

/** Slippage bps → Omniston pips (1 pip = 0.0001%, 1 bps = 0.01% = 100 pips) */
export function bpsToOmnistonPips(bps: number): number {
  return bps * 100;
}

export function getTokenInfo(symbol: string): TokenInfo | undefined {
  return TOKEN_MAP[canonicalSymbol(symbol)];
}
