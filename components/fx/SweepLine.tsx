"use client";

/** Slow vertical sweep line — like a CRT refresh. */
export function SweepLine() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[42] overflow-hidden">
      <div
        className="absolute left-0 right-0 h-20"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(0,255,102,0.05) 50%, transparent)",
          animation: "tm-scan 7s linear infinite",
        }}
      />
    </div>
  );
}
