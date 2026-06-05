"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassSettings } from "@/components/screens/settings/GlassSettings";
import { TerminalSettings } from "@/components/screens/settings/TerminalSettings";
import { useTelegramUser } from "@/components/telegram/TelegramProvider";
import { useWallet } from "@/hooks/useWallet";

export default function SettingsPage() {
  const { theme } = useTheme();
  const user   = useTelegramUser();
  const wallet = useWallet();

  const view = {
    user,
    wallet: {
      isConnected: wallet.isConnected,
      address:     wallet.address,
      walletName:  wallet.walletName,
    },
  };

  return theme === "terminal" ? <TerminalSettings {...view} /> : <GlassSettings {...view} />;
}
