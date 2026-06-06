"use client";

export type TickerItem = { sym: string; pair: string; price: string; delta: number };

// Only the pairs TonMirror actually trades.
const DEFAULT_PAIRS: TickerItem[] = [
  { sym: "TON",   pair: "USDT", price: "1.53",   delta:  1.84 },
  { sym: "USDT",  pair: "TON",  price: "0.654",  delta: -0.10 },
  { sym: "tsTON", pair: "USDT", price: "1.61",   delta:  1.92 },
  { sym: "tsTON", pair: "TON",  price: "1.05",   delta:  0.08 },
];

/**
 * Floating glass price ticker. Sits between the status bar (47px) and the
 * page header. The marquee duplicates its content once so the keyframe can
 * translate -50% and seamlessly loop.
 */
export function GlassTicker({
  items = DEFAULT_PAIRS,
  speed = 45,
}: {
  items?: TickerItem[];
  speed?: number;
}) {
  const loop = [...items, ...items];
  return (
    <div
      className="fixed top-0 left-0 right-0 z-[25] overflow-hidden"
      style={{
        /*
          In Telegram fullscreen mode the Telegram chrome disappears and
          our content starts at the very top of the screen.
          paddingTop: env(safe-area-inset-top) pushes the ticker content
          below the iOS status bar / Android notch.
          The height grows dynamically to still show 30px of ticker below the inset.
        */
        height: "calc(var(--app-top-inset) + 30px)",
        paddingTop: "var(--app-top-inset)",
        background: "var(--glass)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        backdropFilter: "blur(20px) saturate(180%)",
        borderTop: "0.5px solid rgb(var(--hair) / 0.05)",
        borderBottom: "0.5px solid rgb(var(--hair) / 0.08)",
      }}
    >
      {/* Edge fade — left */}
      <div
        className="absolute inset-y-0 left-0 w-7 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to right, var(--glass), transparent)" }}
      />
      {/* Edge fade — right */}
      <div
        className="absolute inset-y-0 right-0 w-7 z-[2] pointer-events-none"
        style={{ background: "linear-gradient(to left, var(--glass), transparent)" }}
      />
      <div
        className="absolute inset-y-0 left-0 flex items-center will-change-transform"
        style={{
          width: "max-content",
          animation: `gl-marquee ${speed}s linear infinite`,
        }}
      >
        {loop.map((p, i) => (
          <TickerCell key={i} p={p} />
        ))}
      </div>
    </div>
  );
}

function TickerCell({ p }: { p: TickerItem }) {
  const up = p.delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-2 px-3.5 whitespace-nowrap"
      style={{ borderRight: "0.5px solid rgb(var(--hair) / 0.08)" }}
    >
      <span className="text-fg" style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.02em" }}>
        {p.sym}<span className="text-subtle" style={{ fontWeight: 500 }}>/{p.pair}</span>
      </span>
      <span className="font-mono gl-tnum text-fg" style={{ fontSize: 11, fontWeight: 500 }}>
        ${p.price}
      </span>
      <span
        className="gl-tnum"
        style={{
          fontSize: 10, fontWeight: 600, letterSpacing: "-0.01em",
          color: up ? "rgb(var(--text1))" : "rgb(var(--text3))",
        }}
      >
        {up ? "↑" : "↓"} {Math.abs(p.delta).toFixed(2)}%
      </span>
    </span>
  );
}
