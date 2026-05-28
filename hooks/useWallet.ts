"use client";

import {
  useTonAddress,
  useTonWallet,
  useTonConnectUI,
  useIsConnectionRestored,
} from "@tonconnect/ui-react";
import { useEffect, useRef } from "react";
import { shortenAddress } from "@/lib/format";

export interface WalletState {
  /** Connected wallet address in user-friendly format, or null */
  address: string | null;
  /** Short display form "UQ…ab12" */
  shortAddress: string | null;
  /** Wallet app name (Tonkeeper, MyTonWallet…) */
  walletName: string | null;
  /** True once session restore attempt is complete */
  isRestored: boolean;
  /** True when wallet is connected */
  isConnected: boolean;
}

/**
 * Thin abstraction over @tonconnect/ui-react hooks.
 * Use this everywhere instead of importing TonConnect hooks directly.
 */
export function useWallet(): WalletState {
  const address   = useTonAddress();       // already user-friendly format
  const wallet    = useTonWallet();
  const isRestored = useIsConnectionRestored();

  return {
    address:      address || null,
    shortAddress: address ? shortenAddress(address, 4) : null,
    walletName:   wallet?.device.appName ?? null,
    isRestored,
    isConnected:  !!address,
  };
}

/**
 * Persists the connected wallet address to DB via /api/user/wallet.
 * Called automatically whenever the wallet connects.
 *
 * @param userId — DB CUID from useCurrentUser
 */
export function usePersistWallet(userId: string | null) {
  const address     = useTonAddress();
  const wallet      = useTonWallet();
  const savedRef    = useRef<string | null>(null); // track last-persisted address

  useEffect(() => {
    if (!address || !userId || savedRef.current === address) return;
    savedRef.current = address;

    fetch("/api/user/wallet", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        userId,
        address,
        walletAppName: wallet?.device.appName ?? null,
      }),
    }).catch((err) => console.warn("[usePersistWallet]", err));
  }, [address, userId, wallet]);
}

/**
 * Returns connect/disconnect functions.
 * Keeps mutation logic out of UI components.
 */
export function useWalletActions() {
  const [tonConnectUI] = useTonConnectUI();

  return {
    connect:    () => tonConnectUI.openModal(),
    disconnect: () => tonConnectUI.disconnect(),
    /** Send a pre-built TON Connect transaction */
    sendTransaction: (tx: {
      messages:   { address: string; amount: string; payload?: string; stateInit?: string }[];
      validUntil: number;
    }) => tonConnectUI.sendTransaction(tx),
  };
}
