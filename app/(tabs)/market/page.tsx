"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassMarket } from "@/components/screens/market/GlassMarket";
import { TerminalMarket } from "@/components/screens/market/TerminalMarket";
import { useLeaders } from "@/hooks/useLeaders";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function MarketPage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const { data: leaders, isLoading: lLoad, isError: lError } = useLeaders(userId ?? undefined);

  const view = { leaders, lLoad, lError };
  return theme === "terminal" ? <TerminalMarket {...view} /> : <GlassMarket {...view} />;
}
