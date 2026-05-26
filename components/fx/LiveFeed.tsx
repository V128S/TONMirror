"use client";

export type FeedEvent = { t: string; who: string; action: string; pnl: number };

/** Matrix-style scrolling event feed. Vertically loops top→bottom with fade mask. */
export function LiveFeed({
  events,
  height = 132,
}: {
  events: FeedEvent[];
  height?: number;
}) {
  return (
    <div className="relative overflow-hidden" style={{ height }}>
      <div
        className="flex flex-col gap-[3px] will-change-transform"
        style={{ animation: "tm-scan 22s linear infinite" }}
      >
        {[...events, ...events].map((e, i) => (
          <div
            key={i}
            className="tm-mono text-[9.5px] text-phos opacity-70 grid gap-1.5"
            style={{ gridTemplateColumns: "52px 1fr auto" }}
          >
            <span className="text-phos-mid">{e.t}</span>
            <span>
              <span className="text-phos-hi">{e.who}</span> ▸ {e.action}
            </span>
            <span style={{ color: e.pnl > 0 ? "#00ffaa" : "#ff3050" }}>
              {e.pnl > 0 ? "+" : ""}
              {e.pnl}
            </span>
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #000 0%, transparent 18%, transparent 82%, #000 100%)",
        }}
      />
    </div>
  );
}
