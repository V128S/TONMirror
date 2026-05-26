"use client";

/**
 * Decorative animated orbs — drift slowly behind every page so the glass
 * surfaces have something colorful to refract. The only chromatic element
 * in the entire design; everything on top is monochrome.
 */
export function GlassBackdrop() {
  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ background: "rgb(var(--bg))" }}
    >
      <div
        className="absolute rounded-full"
        style={{
          top: "-12%", left: "-15%", width: 360, height: 360,
          background: "radial-gradient(circle at 30% 30%, var(--orb1), transparent 70%)",
          filter: "blur(28px)",
          animation: "gl-drift-1 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "22%", right: "-25%", width: 400, height: 400,
          background: "radial-gradient(circle at 50% 50%, var(--orb2), transparent 70%)",
          filter: "blur(32px)",
          animation: "gl-drift-2 26s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: "-8%", left: "18%", width: 320, height: 320,
          background: "radial-gradient(circle at 40% 60%, var(--orb3), transparent 70%)",
          filter: "blur(26px)",
          animation: "gl-drift-3 18s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          top: "48%", left: "-10%", width: 240, height: 240,
          background: "radial-gradient(circle at 50% 50%, var(--orb4), transparent 70%)",
          filter: "blur(24px)",
          animation: "gl-drift-4 30s ease-in-out infinite",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: "20%", right: "-12%", width: 260, height: 260,
          background: "radial-gradient(circle at 50% 50%, var(--orb5), transparent 70%)",
          filter: "blur(26px)",
          animation: "gl-drift-5 24s ease-in-out infinite",
        }}
      />
    </div>
  );
}
