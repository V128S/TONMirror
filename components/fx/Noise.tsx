"use client";

/** SVG turbulence noise overlay, scaled tiny + screen blended for phosphor grain. */
export function Noise({ opacity = 0.06 }: { opacity?: number }) {
  const svg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.4' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 1  0 0 0 0 0.4  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[39]"
      style={{
        backgroundImage: svg,
        backgroundSize: "160px 160px",
        opacity,
        mixBlendMode: "screen",
      }}
    />
  );
}
