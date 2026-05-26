"use client";

import { cn } from "@/lib/utils";
import { useWallet, useWalletActions } from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/Skeleton";

interface ConnectButtonProps {
  className?: string;
  /** Show a compact address badge when connected (default: full button) */
  compact?: boolean;
}

/** TON official blue. Used consistently regardless of app theme. */
const TON_BLUE = "#0098EA";

/**
 * TON wallet connect/disconnect button.
 * Uses inline styles for theme-agnostic TON brand colours — works in both glass and terminal themes.
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
        data-tour="connect-wallet"
        title={`${walletName ?? "Wallet"} — tap to disconnect`}
        className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-medium active:scale-[0.97] transition-all", className)}
        style={{
          background: `${TON_BLUE}1A`, // 10% opacity
          color: TON_BLUE,
          border: `1px solid ${TON_BLUE}33`,
        }}
      >
        <span
          className="size-1.5 rounded-full shrink-0"
          style={{ background: TON_BLUE }}
        />
        {shortAddress}
      </button>
    ) : (
      // Full disconnect button
      <button
        onClick={disconnect}
        data-tour="connect-wallet"
        className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium active:scale-[0.97] transition-all", className)}
        style={{
          background: "var(--glass-hi, rgba(255,255,255,0.06))",
          border: "1px solid var(--glass-edge, rgba(255,255,255,0.12))",
          color: "rgb(var(--text1, 10 10 14))",
        }}
      >
        <span
          className="size-2 rounded-full shrink-0"
          style={{ background: TON_BLUE, boxShadow: `0 0 6px ${TON_BLUE}88` }}
        />
        {shortAddress}
        <span style={{ opacity: 0.4, fontSize: 11 }}>✕</span>
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      data-tour="connect-wallet"
      className={cn(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5",
        "rounded-2xl text-sm font-semibold",
        "active:scale-[0.97] transition-all",
        className,
      )}
      style={{
        background: TON_BLUE,
        color: "#ffffff",
      }}
    >
      Connect Wallet
    </button>
  );
}
