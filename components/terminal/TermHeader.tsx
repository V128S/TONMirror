"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlitchText } from "@/components/fx/GlitchText";
import { PriceTicker, type TickerItem } from "@/components/fx/PriceTicker";
import { usePrices } from "@/hooks/usePrices";

// Fallback shown while prices load
const LOADING_TICKER: TickerItem[] = [
  { sym: "TON",   price: "…", delta: 0 },
  { sym: "STON",  price: "…", delta: 0 },
  { sym: "USDT",  price: "…", delta: 0 },
  { sym: "NOT",   price: "…", delta: 0 },
  { sym: "DOGS",  price: "…", delta: 0 },
  { sym: "HMSTR", price: "…", delta: 0 },
  { sym: "CATI",  price: "…", delta: 0 },
];

/** Page header: ticker rail + glitch title + LIVE indicator. */
export function TermHeader({
  title,
  sub,
}: {
  title: string;
  sub: string;
}) {
  const { data: prices } = usePrices();
  const ticker: TickerItem[] = prices ?? LOADING_TICKER;
  const pathname = usePathname();
  const showGear = pathname !== "/settings";

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
        <div className="flex items-center gap-2">
          {showGear && (
            <Link
              href="/settings"
              aria-label="Settings"
              data-tour="tab-settings"
              className="p-2 inline-flex items-center justify-center"
            >
              <span className="tm-mono text-[12px] text-phos-mid">⚙</span>
            </Link>
          )}
          <span className="tm-mono text-[9px] text-phos-mid">
            <span className="tm-blink text-phos-soft">●</span> LIVE
          </span>
        </div>
      </div>
    </div>
  );
}
