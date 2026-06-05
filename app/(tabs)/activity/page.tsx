"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassActivity } from "@/components/screens/activity/GlassActivity";
import { TerminalActivity } from "@/components/screens/activity/TerminalActivity";
import { useActivity } from "@/hooks/useActivity";
import { useStrategies } from "@/hooks/useStrategies";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function ActivityPage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const { data: events, isLoading: eLoad, isError: eError } = useActivity({ limit: 50 });
  const { data: strategies, isLoading: stratLoading } = useStrategies(userId ?? undefined);
  const activeCount = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday = events?.filter((e) => e.decision?.outcome === "accepted" &&
    new Date(e.timestamp).toDateString() === new Date().toDateString()).length ?? 0;
  const totalVolume = events?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;
  const view = { events, strategies, eLoad, eError, stratLoading, activeCount, copiedToday, totalVolume };
  return theme === "terminal" ? <TerminalActivity {...view} /> : <GlassActivity {...view} />;
}
