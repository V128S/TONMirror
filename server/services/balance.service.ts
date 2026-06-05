/**
 * BalanceService — pre-flight wallet balance / gas checks before a live swap.
 *
 * The connected wallet is the ultimate guard (it won't sign a tx it can't
 * afford), but checking up front lets us fail with a clear message instead of a
 * cryptic wallet rejection. Reads balances from TonAPI v2.
 *
 * Fail-open: if a balance can't be fetched (network/parse error) we DON'T block
 * — the wallet still protects the user's funds. We only throw on a *confirmed*
 * shortfall.
 */
import { fetchWithRetry } from "@/lib/fetch-retry";
import { getTokenInfo } from "@/modules/omniston/token-map";

/** TON kept aside for swap gas / forward fees (jetton transfer + DEX hop). */
const GAS_RESERVE_TON = 0.3;
const TON_API = "https://tonapi.io/v2";

function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key = process.env.TON_API_KEY;
  if (key) headers["Authorization"] = `Bearer ${key}`;
  return headers;
}

/** Native TON balance (decimal), or null when it can't be determined. */
export async function getTonBalance(address: string): Promise<number | null> {
  try {
    const res = await fetchWithRetry(
      `${TON_API}/accounts/${encodeURIComponent(address)}`,
      { headers: apiHeaders() },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { balance?: number | string };
    const nano = typeof json.balance === "string" ? Number(json.balance) : json.balance;
    if (typeof nano !== "number" || !Number.isFinite(nano)) return null;
    return nano / 1e9;
  } catch {
    return null;
  }
}

/** Jetton balance (decimal) for `jettonMaster`, or null when undeterminable. */
export async function getJettonBalance(
  address: string,
  jettonMaster: string,
  decimals: number,
): Promise<number | null> {
  try {
    const res = await fetchWithRetry(
      `${TON_API}/accounts/${encodeURIComponent(address)}/jettons/${encodeURIComponent(jettonMaster)}`,
      { headers: apiHeaders() },
    );
    // 404 = the wallet has never held this jetton → effectively zero balance.
    if (res.status === 404) return 0;
    if (!res.ok) return null;
    const json = (await res.json()) as { balance?: string };
    if (typeof json.balance !== "string") return null;
    return Number(json.balance) / 10 ** decimals;
  } catch {
    return null;
  }
}

export type BalanceCheckInput = {
  walletAddress: string;
  soldToken:     string;
  /** Amount of the sold token, in its own decimal units (not USD). */
  amountInDecimal: number;
};

/**
 * Throws when the wallet provably can't afford the swap (sold-token balance or
 * TON gas reserve). No-op when balances can't be verified (fail-open).
 */
export async function assertSufficientBalance(input: BalanceCheckInput): Promise<void> {
  const { walletAddress, soldToken, amountInDecimal } = input;
  const symbol = soldToken.trim().toUpperCase();

  if (symbol === "TON") {
    const ton = await getTonBalance(walletAddress);
    if (ton === null) return; // can't verify → let the wallet decide
    const need = amountInDecimal + GAS_RESERVE_TON;
    if (ton < need) {
      throw new Error(
        `Insufficient TON: need ~${need.toFixed(2)} (incl. gas), wallet has ${ton.toFixed(2)}`,
      );
    }
    return;
  }

  // Jetton sold (USDT / tsTON): need the jetton amount + TON for gas.
  const info = getTokenInfo(symbol);
  if (!info?.address) return; // unknown token — not our concern here

  const ton = await getTonBalance(walletAddress);
  if (ton !== null && ton < GAS_RESERVE_TON) {
    throw new Error(
      `Insufficient TON for gas: need ~${GAS_RESERVE_TON} TON, wallet has ${ton.toFixed(3)}`,
    );
  }

  const jetton = await getJettonBalance(walletAddress, info.address, info.decimals);
  if (jetton !== null && jetton < amountInDecimal) {
    throw new Error(
      `Insufficient ${symbol}: need ${amountInDecimal}, wallet has ${jetton}`,
    );
  }
}
