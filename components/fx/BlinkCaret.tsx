"use client";

export function BlinkCaret({ className = "" }: { className?: string }) {
  return <span className={`tm-blink font-bold ${className}`}>▌</span>;
}
