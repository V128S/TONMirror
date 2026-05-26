"use client";

import { useMemo } from "react";

/** SVG sparkline with phosphor glow + filled area + endpoint dot. */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = "#00ff66",
  fill = true,
  glow = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  glow?: boolean;
}) {
  const { d, lastY } = useMemo(() => {
    const min = Math.min(...data),
      max = Math.max(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const path = data
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(
            height -
            ((v - min) / range) * height
          ).toFixed(1)}`,
      )
      .join(" ");
    const last = data[data.length - 1];
    const lastYv = height - ((last - min) / range) * height;
    return { d: path, lastY: lastYv };
  }, [data, width, height]);

  return (
    <svg
      width={width}
      height={height}
      style={{
        overflow: "visible",
        filter: glow ? `drop-shadow(0 0 3px ${color})` : undefined,
      }}
    >
      {fill && (
        <path d={`${d} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} />
      )}
      <path d={d} stroke={color} strokeWidth={1.4} fill="none" />
      <circle cx={width} cy={lastY} r={2} fill={color} />
    </svg>
  );
}
