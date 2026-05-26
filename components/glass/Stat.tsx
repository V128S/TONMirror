"use client";

import { Glass } from "./Glass";

/** Tiny stat cell — 3-up grid building block. */
export function StatCell({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Glass radius={18} padding={12}>
      <div className="text-subtle" style={{ fontSize: 10, letterSpacing: "0.02em" }}>{label}</div>
      <div
        className="text-fg gl-tnum"
        style={{ fontSize: 20, fontWeight: 700, marginTop: 4, letterSpacing: "-0.02em" }}
      >
        {value}
      </div>
      {sub && <div className="text-subtle" style={{ fontSize: 10, marginTop: 1 }}>{sub}</div>}
    </Glass>
  );
}

/** Compact inline stat for header rows (no glass wrap). */
export function InlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-subtle" style={{ fontSize: 10 }}>{label}</div>
      <div
        className="text-fg gl-tnum"
        style={{ fontSize: 15, fontWeight: 600, marginTop: 2, letterSpacing: "-0.01em" }}
      >
        {value}
      </div>
    </div>
  );
}
