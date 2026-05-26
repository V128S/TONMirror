"use client";

export function prettyName(raw: string) {
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map((w) => (w[0]?.toUpperCase() ?? "") + w.slice(1))
    .join(" ");
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = prettyName(name)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: "var(--glass-hi)",
        border: "0.5px solid var(--glass-edge)",
        WebkitBackdropFilter: "blur(12px)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 1px 0 var(--glass-edge) inset, 0 2px 6px -2px rgba(0,0,0,0.08)",
        color: "rgb(var(--text1))",
        fontSize: Math.round(size * 0.32),
        fontWeight: 600,
      }}
    >
      {initials}
    </div>
  );
}
