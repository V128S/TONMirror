"use client";

import { useEffect, useState } from "react";

export function GlassStatusBar() {
  const [now, setNow] = useState<string>(() => fmt(new Date()));
  useEffect(() => {
    const id = setInterval(() => setNow(fmt(new Date())), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div
      className="absolute top-0 left-0 right-0 h-[47px] z-30 flex items-center justify-between px-7 pt-[18px] text-fg gl-tnum"
      style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}
    >
      <span>{now}</span>
      <span className="flex gap-1.5 items-center">
        {/* Signal bars */}
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <path d="M1 10h2V7H1v3zm4 0h2V5H5v5zm4 0h2V3H9v7zm4 0h2V1h-2v9z" fill="currentColor"/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M8 2.5c2 0 4 .8 5.5 2.3l.7-.7C12.6 2.4 10.4 1.5 8 1.5S3.4 2.4 1.8 4.1l.7.7C4 3.3 6 2.5 8 2.5zm0 2c1.4 0 2.7.6 3.7 1.5l.7-.7C11.2 4.2 9.7 3.5 8 3.5s-3.2.7-4.4 1.8l.7.7C5.3 5.1 6.6 4.5 8 4.5zm0 2c.9 0 1.7.3 2.3.9l.7-.7C10.2 6 9.1 5.5 8 5.5s-2.2.5-3 1.2l.7.7c.6-.6 1.4-.9 2.3-.9zM8 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" fill="currentColor"/>
        </svg>
        {/* Battery */}
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none">
          <rect x="0.5" y="0.5" width="22" height="11" rx="3" stroke="currentColor" strokeOpacity="0.4" fill="none"/>
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill="currentColor"/>
          <rect x="23.5" y="3.5" width="1.5" height="5" rx="0.75" fill="currentColor" fillOpacity="0.4"/>
        </svg>
      </span>
    </div>
  );
}

function fmt(d: Date) {
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}
