"use client";

import { useQuery } from "@tanstack/react-query";
import type { PriceItem } from "@/app/api/prices/route";

export type { PriceItem };

export function usePrices() {
  return useQuery<PriceItem[]>({
    queryKey:       ["prices"],
    queryFn:        async () => {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error("Failed to fetch prices");
      const json = await res.json();
      return json.data as PriceItem[];
    },
    refetchInterval: 60_000, // refresh every 60 s
    staleTime:       55_000,
  });
}
