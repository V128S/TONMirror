"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { useState, type ReactNode } from "react";
import { TelegramProvider } from "@/components/telegram/TelegramProvider";
import { publicEnv } from "@/lib/env";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { usePersistWallet } from "@/hooks/useWallet";

/**
 * Inner component that runs hooks which need QueryClient and TelegramProvider.
 * Separated from Providers so hooks can access context.
 */
function AppHooks() {
  const { userId } = useCurrentUser();
  usePersistWallet(userId);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  // Create QueryClient per-session so HMR doesn't share state
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            30_000,
            refetchOnWindowFocus: false,
            retry:                1,
          },
        },
      }),
  );

  return (
    <TelegramProvider>
      <TonConnectUIProvider manifestUrl={publicEnv.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL}>
        <QueryClientProvider client={queryClient}>
          <AppHooks />
          {children}
          {process.env.NODE_ENV === "development" && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </TonConnectUIProvider>
    </TelegramProvider>
  );
}
