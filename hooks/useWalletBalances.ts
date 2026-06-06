"use client";

import { useQuery } from "@tanstack/react-query";

export interface WalletBalances {
  TON:   number | null;
  tsTON: number | null;
  USDT:  number | null;
}

/**
 * On-chain TON / tsTON / USDT balances for the connected wallet.
 * Disabled until an address is known; refetches periodically.
 */
export function useWalletBalances(address: string | null) {
  return useQuery<WalletBalances>({
    queryKey: ["wallet-balances", address],
    enabled:  !!address,
    queryFn:  async () => {
      const res = await fetch(`/api/wallet/balances?address=${encodeURIComponent(address!)}`);
      if (!res.ok) throw new Error("Failed to load balances");
      const json = await res.json();
      return json.data as WalletBalances;
    },
    refetchInterval: 30_000,
    staleTime:       15_000,
  });
}
