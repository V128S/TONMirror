"use client";

export function Sparkline({
  data,
  width = 280,
  height = 60,
  fill = true,
  muted = false,
}: {
  data: number[];
  width?: number;
  height?: number;
  fill?: boolean;
  muted?: boolean;
}) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * (height - 4) - 2;
    return [x, y] as const;
  });
  const d = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const dFill = `${d} L${width},${height} L0,${height} Z`;
  const last = pts[pts.length - 1];
  const uid = "sl-" + Math.random().toString(36).slice(2, 8);
  return (
    <svg
      width={width}
      height={height}
      style={{ display: "block", overflow: "visible", color: muted ? "rgb(var(--text3))" : "rgb(var(--text1))" }}
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={dFill} fill={`url(#${uid})`} />}
      <path d={d} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill="currentColor" />
      <circle cx={last[0]} cy={last[1]} r="6" fill="currentColor" opacity="0.12" />
    </svg>
  );
}
