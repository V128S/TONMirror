"use client";

import { useEffect, useState } from "react";
import { BlinkCaret } from "./BlinkCaret";

export function TypeOn({
  text,
  speed = 28,
  className = "",
  caret = true,
}: {
  text: string;
  speed?: number;
  className?: string;
  caret?: boolean;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(id);
          return v;
        }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return (
    <span className={className}>
      {text.slice(0, n)}
      {caret && n < text.length && <BlinkCaret />}
    </span>
  );
}
