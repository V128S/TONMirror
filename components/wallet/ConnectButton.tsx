"use client";

import { cn } from "@/lib/utils";
import { useWallet, useWalletActions } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/Skeleton";

interface ConnectButtonProps {
  className?: string;
  /** Show a compact address badge when connected (default: full button) */
  compact?: boolean;
}

/**
 * TON wallet connect/disconnect button.
 * Matches the dark TonMirror design system.
 * Uses our useWallet / useWalletActions abstractions — no direct SDK imports in UI.
 */
export function ConnectButton({ className, compact = false }: ConnectButtonProps) {
  const { isConnected, shortAddress, walletName, isRestored } = useWallet();
  const { connect, disconnect } = useWalletActions();

  // While session restoration is pending, show skeleton
  if (!isRestored) {
    return <Skeleton className={cn("h-9 w-36 rounded-2xl", className)} />;
  }

  if (isConnected && shortAddress) {
    return compact ? (
      // Compact badge variant: address + tap to disconnect
      <button
        onClick={disconnect}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5",
          "rounded-2xl bg-ton-500/15 text-ton-400 text-xs font-medium",
          "hover:bg-ton-500/25 active:scale-[0.97] transition-all",
          className,
        )}
        title={`${walletName ?? "Wallet"} — tap to disconnect`}
      >
        <span className="size-1.5 rounded-full bg-ton-400 shrink-0" />
        {shortAddress}
      </button>
    ) : (
      // Full disconnect button
      <button
        onClick={disconnect}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2.5",
          "rounded-2xl bg-surface-2 border border-surface-border",
          "text-text-primary text-sm font-medium",
          "hover:bg-surface-3 active:scale-[0.97] transition-all",
          className,
        )}
      >
        <span className="size-2 rounded-full bg-green-400 shrink-0" />
        {shortAddress}
        <span className="text-text-muted text-xs">✕</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5",
        "rounded-2xl bg-ton-500 text-white text-sm font-semibold",
        "hover:bg-ton-600 active:scale-[0.97] transition-all",
        className,
      )}
    >
      Connect Wallet
    </button>
  );
}
