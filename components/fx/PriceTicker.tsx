"use client";

export type TickerItem = { sym: string; price: string; delta: number };

/** Horizontally-scrolling crypto ticker. Items duplicated for seamless loop. */
export function PriceTicker({
  items,
  speed = 50,
  color = "#00ff66",
}: {
  items: TickerItem[];
  speed?: number;
  color?: string;
}) {
  const Row = () => (
    <div className="inline-flex gap-7 pr-7">
      {items.map((it, i) => (
        <span
          key={i}
          className="tm-mono whitespace-nowrap text-[11px] text-phos-mid"
        >
          <span style={{ color }}>{it.sym}</span> {it.price}{" "}
          <span style={{ color: it.delta >= 0 ? "#00ffaa" : "#ff3050" }}>
            {it.delta >= 0 ? "▲" : "▼"}
            {Math.abs(it.delta).toFixed(2)}%
          </span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden w-full">
      <div
        className="inline-flex will-change-transform"
        style={{ animation: `tm-ticker ${speed}s linear infinite` }}
      >
        <Row />
        <Row />
      </div>
    </div>
  );
}
