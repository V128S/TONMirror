"use client";

/** Faux phosphor status bar — sits at the top of the Telegram Mini App viewport. */
export function TermStatusBar({ time = "14:02", battery = 87 }: { time?: string; battery?: number }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[47px] z-30 flex items-center justify-between px-7 pt-[18px] text-phos tm-mono">
      <span className="text-[13px] font-bold tracking-[0.05em]">{time}</span>
      <span className="text-[10px] text-phos-mid tracking-[0.15em]">::TONMIRROR.RUN::</span>
      <span className="text-[11px] flex gap-1 items-center">
        ◤◤◤◤◣ <span className="text-phos-soft">{battery}%</span>
      </span>
    </div>
  );
}
