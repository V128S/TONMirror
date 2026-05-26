"use client";

/** CRT scanlines — repeating horizontal dark bars, multiply blend. */
export function Scanlines({ opacity = 0.22 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background: `repeating-linear-gradient(0deg, rgba(0,0,0,${opacity}) 0px, rgba(0,0,0,${opacity}) 1px, transparent 1px, transparent 3px)`,
        mixBlendMode: "multiply",
      }}
    />
  );
}
