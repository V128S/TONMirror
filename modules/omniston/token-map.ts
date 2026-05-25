/**
 * Maps TonMirror token symbols to Omniston SDK AssetId types and decimals.
 * Keep in sync with prisma/seed.ts TOKENS array.
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
  USDT: {
    assetId:  jetton("EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"),
    decimals: 6,
    address:  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  },
  STON: {
    assetId:  jetton("EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO"),
    decimals: 9,
    address:  "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
  },
  NOT: {
    assetId:  jetton("EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT"),
    decimals: 9,
    address:  "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
  },
  DOGS: {
    assetId:  jetton("EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS"),
    decimals: 0,
    address:  "EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS",
  },
};

/** Convert decimal amount to base units (integer string) */
export function toBaseUnits(decimal: number, decimals: number): string {
  const factor = BigInt(10) ** BigInt(decimals);
  // Use integer math to avoid float precision issues
  const whole = Math.floor(decimal);
  const frac  = decimal - whole;
  const wholeUnits = BigInt(whole) * factor;
  const fracUnits  = BigInt(Math.round(frac * Number(factor)));
  return (wholeUnits + fracUnits).toString();
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
  return TOKEN_MAP[symbol.toUpperCase()];
}
