"use client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassHome } from "@/components/screens/home/GlassHome";
import { TerminalHome } from "@/components/screens/home/TerminalHome";
import { useStrategies } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { useWallet } from "@/hooks/useWallet";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function HomePage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const { data: strategies, isLoading: stratLoading } = useStrategies(userId ?? undefined);
  const { data: activity, isLoading: actLoading } = useActivity({ limit: 10 });
  const wallet = useWallet();
  const { data: balances, isLoading: balLoading } = useWalletBalances(wallet.address);

  const activeCount = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday = activity?.filter(
    (e) => e.decision?.outcome === "accepted" &&
      new Date(e.timestamp).toDateString() === new Date().toDateString(),
  ).length ?? 0;
  const totalVolume = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;

  const view = {
    strategies, activity, stratLoading, actLoading,
    wallet: { isConnected: wallet.isConnected, isRestored: wallet.isRestored, shortAddress: wallet.shortAddress },
    balances, balLoading,
    activeCount, copiedToday, totalVolume,
  };
  return theme === "terminal" ? <TerminalHome {...view} /> : <GlassHome {...view} />;
}
