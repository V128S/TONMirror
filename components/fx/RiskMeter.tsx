"use client";

import { useEffect, useState } from "react";

/** Segmented animated risk bar. Color steps phos → warn → danger with score. */
export function RiskMeter({
  score = 5,
  max = 10,
  label = "RISK",
  segments = 14,
  height = 8,
}: {
  score?: number;
  max?: number;
  label?: string;
  segments?: number;
  height?: number;
}) {
  // tick for the flicker on the last filled segment
  const [t, setT] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT((v) => v + 1), 900);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(1, Math.max(0, score / max));
  const color = score <= 3 ? "#00ff66" : score <= 6 ? "#ffd500" : "#ff3050";
  const filled = Math.round(segments * pct);

  return (
    <div className="flex flex-col gap-[3px]">
      <div className="tm-mono flex justify-between text-[9px] text-phos-mid tracking-[0.1em]">
        <span>{label}</span>
        <span style={{ color }}>
          {score.toFixed(1)}/{max}
        </span>
      </div>
      <div className="flex gap-[2px]">
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < filled;
          const flick = on && i === filled - 1 && t % 2 === 0;
          return (
            <div
              key={i}
              className="flex-1"
              style={{
                height,
                background: on ? color : "#0a3d1f",
                boxShadow: on ? `0 0 4px ${color}` : "none",
                opacity: flick ? 0.6 : 1,
                clipPath: "polygon(15% 0, 100% 0, 85% 100%, 0 100%)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
