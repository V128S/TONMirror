"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaderKeys }                  from "@/hooks/useLeaders";
import type { CrawlerResult, WhaleScore } from "@/modules/whale-discovery/types";

export interface ScanResult {
  result: CrawlerResult;
  whales?: WhaleScore[];
}

export function useRunWhaleScanner() {
  const queryClient = useQueryClient();

  return useMutation<ScanResult, Error, { dryRun?: boolean }>({
    mutationFn: async ({ dryRun = false }) => {
      const res  = await fetch("/api/demo/discover-whales", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ dryRun }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Scanner failed");
      return json.data as ScanResult;
    },
    onSuccess: (data) => {
      // Invalidate leaders cache after real run (not dry-run)
      if (!data.whales) {
        queryClient.invalidateQueries({ queryKey: leaderKeys.all });
      }
    },
  });
}
