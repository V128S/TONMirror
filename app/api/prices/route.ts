import { NextResponse } from "next/server";

// CoinGecko coin IDs → ticker symbol
const COINS: Record<string, string> = {
  "the-open-network": "TON",
  "ston-fi":          "STON",
  "tether":           "USDT",
  "notcoin":          "NOT",
  "dogs-2":           "DOGS",
  "hamster-kombat":   "HMSTR",
  "catizen":          "CATI",
};

export interface PriceItem {
  sym:   string;
  price: string;
  delta: number; // 24h % change
}

// Cache response for 60 s to avoid rate-limiting CoinGecko
let cache: { data: PriceItem[]; ts: number } | null = null;
const CACHE_TTL = 60_000;

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json({ data: cache.data });
  }

  try {
    const ids = Object.keys(COINS).join(",");
    const url =
      `https://api.coingecko.com/api/v3/simple/price` +
      `?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next:    { revalidate: 60 },
    });

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);

    const raw = await res.json() as Record<string, {
      usd: number;
      usd_24h_change: number;
    }>;

    const data: PriceItem[] = Object.entries(COINS).map(([id, sym]) => {
      const row = raw[id];
      if (!row) return { sym, price: "—", delta: 0 };

      const p = row.usd;
      // Format price: show enough significant digits
      const price =
        p >= 1_000 ? `$${p.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
        : p >= 1   ? `$${p.toFixed(3)}`
        : p >= 0.01 ? `$${p.toFixed(4)}`
        :              `$${p.toFixed(6)}`;

      return {
        sym,
        price,
        delta: Math.round((row.usd_24h_change ?? 0) * 100) / 100,
      };
    });

    cache = { data, ts: Date.now() };
    return NextResponse.json({ data });
  } catch (err) {
    console.error("[prices] CoinGecko fetch failed:", err);

    // Fallback: return cached stale data if available, otherwise hardcoded
    if (cache) return NextResponse.json({ data: cache.data });

    const fallback: PriceItem[] = [
      { sym: "TON",   price: "—", delta: 0 },
      { sym: "STON",  price: "—", delta: 0 },
      { sym: "USDT",  price: "$1.000", delta: 0 },
      { sym: "NOT",   price: "—", delta: 0 },
      { sym: "DOGS",  price: "—", delta: 0 },
      { sym: "HMSTR", price: "—", delta: 0 },
      { sym: "CATI",  price: "—", delta: 0 },
    ];
    return NextResponse.json({ data: fallback });
  }
}
