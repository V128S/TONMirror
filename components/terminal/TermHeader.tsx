"use client";

import { GlitchText } from "@/components/fx/GlitchText";
import { PriceTicker, type TickerItem } from "@/components/fx/PriceTicker";

// Demo ticker — replace with live data once you have a token-price hook.
const DEFAULT_TICKER: TickerItem[] = [
  { sym: "TON",   price: "$2.94",   delta:  1.84 },
  { sym: "STON",  price: "$0.782",  delta: -0.92 },
  { sym: "USDT",  price: "$1.000",  delta:  0.01 },
  { sym: "NOT",   price: "$0.0072", delta:  4.21 },
  { sym: "DOGS",  price: "$0.0001", delta: -2.10 },
  { sym: "HMSTR", price: "$0.0044", delta:  0.85 },
  { sym: "ANON",  price: "$1.420",  delta: -1.34 },
  { sym: "CATI",  price: "$0.220",  delta:  6.42 },
];

/** Page header: ticker rail + glitch title + LIVE indicator. */
export function TermHeader({
  title,
  sub,
  ticker = DEFAULT_TICKER,
}: {
  title: string;
  sub: string;
  ticker?: TickerItem[];
}) {
  return (
    <div className="relative z-20">
      <div className="border-b border-phos-border-dim bg-phos/[0.025] py-[5px]">
        <PriceTicker items={ticker} speed={50} />
      </div>
      <div className="px-4 pt-2.5 pb-1.5 flex items-baseline justify-between">
        <div>
          <div className="tm-mono tm-glow text-[9px] text-phos-mid tracking-[0.2em]">// {sub}</div>
          <div className="text-[22px]">
            <GlitchText>{title}</GlitchText>
          </div>
        </div>
        <span className="tm-mono text-[9px] text-phos-mid">
          <span className="tm-blink text-phos-soft">●</span> LIVE
        </span>
      </div>
    </div>
  );
}
