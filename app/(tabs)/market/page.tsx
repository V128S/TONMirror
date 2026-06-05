"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassMarket } from "@/components/screens/market/GlassMarket";
import { TerminalMarket } from "@/components/screens/market/TerminalMarket";
import { useLeaders } from "@/hooks/useLeaders";
import { useActivity } from "@/hooks/useActivity";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function MarketPageInner() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"leaders" | "activity">("leaders");

  const { data: leaders, isLoading: lLoad, isError: lError } = useLeaders(userId ?? undefined);
  const { data: events, isLoading: eLoad, isError: eError } = useActivity({ limit: 50 });

  useEffect(() => {
    setActiveTab(searchParams?.get("tab") === "activity" ? "activity" : "leaders");
  }, [searchParams]);

  const view = { leaders, events, lLoad, lError, eLoad, eError, activeTab, setActiveTab };
  return theme === "terminal" ? <TerminalMarket {...view} /> : <GlassMarket {...view} />;
}

export default function MarketPage() {
  return (
    <Suspense fallback={null}>
      <MarketPageInner />
    </Suspense>
  );
}
