"use client";

import { useQuery } from "@tanstack/react-query";
import { useTelegram } from "@/components/telegram/TelegramProvider";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CurrentUser {
  /** DB CUID — use this as userId in all other API calls */
  id:          string;
  telegramId:  string | null;
  username:    string | null;
  displayName: string | null;
  isDemo:      boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Initialises the current user on app load.
 *
 * - Calls POST /api/user/init with the Telegram user's data
 * - Returns the DB user record (including its CUID `id`)
 * - Fully idempotent: safe to call multiple times
 * - When TelegramProvider is not ready yet, query is suspended
 *
 * Usage:
 *   const { userId, isReady } = useCurrentUser();
 */
export function useCurrentUser(): {
  user:      CurrentUser | null;
  /** DB CUID — pass this as `userId` to all user-scoped hooks */
  userId:    string | null;
  isLoading: boolean;
  /** true once the user record exists in DB and is ready to use */
  isReady:   boolean;
} {
  const { isReady: tgReady, user: tgUser } = useTelegram();

  const { data, isLoading, isError } = useQuery<CurrentUser>({
    queryKey: ["currentUser", tgUser?.id],
    queryFn:  async () => {
      const res = await fetch("/api/user/init", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          telegramId: String(tgUser!.id),
          firstName:  tgUser!.firstName,
          lastName:   tgUser?.lastName,
          username:   tgUser?.username,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to init user");
      }
      const json = await res.json() as { data: CurrentUser };
      return json.data;
    },
    enabled:    tgReady && !!tgUser,
    staleTime:  5 * 60_000,  // re-init at most once every 5 minutes
    retry:      2,
  });

  const userId = (!isLoading && !isError && data) ? data.id : null;

  return {
    user:      data ?? null,
    userId,
    isLoading: tgReady && !!tgUser && isLoading,
    isReady:   !!userId,
  };
}
