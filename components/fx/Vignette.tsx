"use client";

export function Vignette() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[41]"
      style={{
        background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)",
      }}
    />
  );
}
