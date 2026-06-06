import { NextResponse } from "next/server";
import { z } from "zod";
import { getTonBalance, getJettonBalance } from "@/server/services/balance.service";
import { getTokenInfo } from "@/modules/omniston/token-map";

const querySchema = z.object({ address: z.string().min(10) });

export type WalletBalances = {
  TON:   number | null;
  tsTON: number | null;
  USDT:  number | null;
};

/**
 * GET /api/wallet/balances?address=UQ...
 * Public on-chain balances (TON + the jettons TonMirror trades) for display.
 * Returns null per token when it can't be fetched (never throws).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ address: searchParams.get("address") });
  if (!parsed.success) {
    return NextResponse.json({ error: "address is required" }, { status: 422 });
  }
  const address = parsed.data.address;

  const usdt  = getTokenInfo("USDT")!;
  const tston = getTokenInfo("tsTON")!;

  const [TON, USDT, tsTON] = await Promise.all([
    getTonBalance(address),
    getJettonBalance(address, usdt.address!, usdt.decimals),
    getJettonBalance(address, tston.address!, tston.decimals),
  ]);

  return NextResponse.json({ data: { TON, tsTON, USDT } satisfies WalletBalances });
}
