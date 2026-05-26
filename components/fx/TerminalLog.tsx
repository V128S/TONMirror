"use client";

import { useEffect, useRef, useState } from "react";
import { BlinkCaret } from "./BlinkCaret";

/** Type-on terminal log: lines reveal one char at a time, prompt-prefixed, with caret. */
export function TerminalLog({
  lines,
  speed = 18,
  prompt = "$",
  className = "",
}: {
  lines: string[];
  speed?: number;
  prompt?: string;
  className?: string;
}) {
  const [shown, setShown] = useState<string[]>([]);
  const idxRef = useRef(0);
  const charRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    charRef.current = 0;
    setShown([]);
    const id = setInterval(() => {
      const i = idxRef.current;
      if (i >= lines.length) {
        clearInterval(id);
        return;
      }
      const ln = lines[i];
      charRef.current++;
      if (charRef.current > ln.length) {
        idxRef.current++;
        charRef.current = 0;
      } else {
        setShown((prev) => {
          const next = prev.slice(0, i + 1);
          next[i] = ln.slice(0, charRef.current);
          return next;
        });
      }
    }, speed);
    return () => clearInterval(id);
  }, [lines, speed]);

  return (
    <div className={`tm-mono text-phos text-[10px] leading-[14px] ${className}`}>
      {shown.map((l, i) => (
        <div key={i}>
          <span className="text-phos-dim">{prompt}</span> <span>{l}</span>
        </div>
      ))}
      <div>
        <span className="text-phos-dim">{prompt}</span> <BlinkCaret />
      </div>
    </div>
  );
}
