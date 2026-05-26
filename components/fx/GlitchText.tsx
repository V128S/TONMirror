"use client";

import { useEffect, useState } from "react";

/** RGB-split glitch text. Briefly splits cyan/danger copies on a random interval. */
export function GlitchText({
  children,
  className = "",
  intensity = 1.5,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const [g, setG] = useState(false);
  useEffect(() => {
    const id = setInterval(() => {
      setG(true);
      setTimeout(() => setG(false), 180 + Math.random() * 200);
    }, 2200 + Math.random() * 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`relative inline-block tm-disp text-phos-hi tm-glow ${className}`}>
      <span className="relative z-[2]">{children}</span>
      {g && (
        <>
          <span
            aria-hidden
            className="absolute inset-0 text-danger pointer-events-none"
            style={{
              transform: `translate(${intensity}px, -1px)`,
              clipPath: "inset(10% 0 60% 0)",
              opacity: 0.85,
              mixBlendMode: "screen",
            }}
          >
            {children}
          </span>
          <span
            aria-hidden
            className="absolute inset-0 pointer-events-none"
            style={{
              color: "#00ddff",
              transform: `translate(-${intensity}px, 1px)`,
              clipPath: "inset(55% 0 10% 0)",
              opacity: 0.85,
              mixBlendMode: "screen",
            }}
          >
            {children}
          </span>
        </>
      )}
    </span>
  );
}
