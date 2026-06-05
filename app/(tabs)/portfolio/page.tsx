"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassPortfolio } from "@/components/screens/portfolio/GlassPortfolio";
import { TerminalPortfolio } from "@/components/screens/portfolio/TerminalPortfolio";

import { useTonAddress } from "@tonconnect/ui-react";
import { useStrategies } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { useTonBalance } from "@/hooks/useTonBalance";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function PortfolioPage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const address = useTonAddress();
  const isConnected = !!address;
  const { tonFormatted, usdFormatted, source, isLoading: balanceLoading } = useTonBalance();
  const { data: strategies, isLoading: sLoad } = useStrategies(userId ?? undefined);
  const { data: activity, isLoading: aLoad } = useActivity({ limit: 100 });

  const totalVolume  = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;
  const copiedCount  = activity?.filter((e) => e.decision?.outcome === "accepted").length ?? 0;
  const rejectedCount = activity?.filter((e) => e.decision?.outcome === "rejected").length ?? 0;
  const reviewCount  = activity?.filter((e) => e.decision?.outcome === "manual_review").length ?? 0;

  const active    = strategies?.filter((s) => !s.isPaused) ?? [];
  const paused    = strategies?.filter((s) => s.isPaused)  ?? [];
  const isLoading = sLoad || aLoad;

  const aggSpark = Array.from({ length: 22 }).map(
    (_, i) => 8 + i * 4 + Math.sin(i * 0.8) * 6,
  );

  const view = {
    strategies,
    active,
    paused,
    isLoading,
    isConnected,
    tonFormatted,
    usdFormatted,
    balanceSource: source,
    balanceLoading,
    totalVolume,
    copiedCount,
    rejectedCount,
    reviewCount,
    aggSpark,
  };

  return theme === "terminal" ? <TerminalPortfolio {...view} /> : <GlassPortfolio {...view} />;
}
