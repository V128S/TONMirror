"use client";

import { useEffect, useRef, useState } from "react";

/** Decoding/scramble effect — characters resolve left-to-right. */
export function ScrambleText({
  value,
  ms = 60,
  settle = 14,
  className = "",
}: {
  value: string;
  ms?: number;
  settle?: number;
  className?: string;
}) {
  const [out, setOut] = useState(value);
  const targetRef = useRef(value);

  useEffect(() => {
    targetRef.current = value;
    const chars = "!<>-_\\/[]{}—=+*^?#$%01ABCDEF";
    let frame = 0;
    const id = setInterval(() => {
      const t = targetRef.current;
      frame++;
      let s = "";
      for (let i = 0; i < t.length; i++) {
        if (frame > settle + i) s += t[i];
        else if (t[i] === " ") s += " ";
        else s += chars[Math.floor(Math.random() * chars.length)];
      }
      setOut(s);
      if (frame > settle + t.length) clearInterval(id);
    }, ms);
    return () => clearInterval(id);
  }, [value, ms, settle]);

  return <span className={`tm-mono ${className}`}>{out}</span>;
}
