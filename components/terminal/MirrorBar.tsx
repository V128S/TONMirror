"use client";

/** Section divider with reflection-themed label, used between content blocks. */
export function MirrorBar({ label = "MIRROR · LINE" }: { label?: string }) {
  return (
    <div className="w-full flex items-center gap-2 text-phos-mid text-[10px] tm-mono">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,102,0.35))" }} />
      <span className="tracking-[0.2em]">◢ {label} ◣</span>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(0,255,102,0.35), transparent)" }} />
    </div>
  );
}
