"use client";

import type { ReactNode } from "react";

export function SettingRow({
  icon,
  label,
  control,
  right,
  last,
  danger,
  onClick,
}: {
  icon?: ReactNode;
  label: string;
  control?: ReactNode;
  right?: ReactNode;
  last?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="grid items-center gap-3 px-3 py-3"
      style={{
        gridTemplateColumns: "32px 1fr auto",
        borderBottom: last ? "none" : "0.5px solid rgb(var(--hair) / 0.08)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{ color: danger ? "rgb(var(--text3))" : "rgb(var(--text2))" }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 13.5,
          fontWeight: 500,
          color: danger ? "rgb(var(--text2))" : "rgb(var(--text1))",
        }}
      >
        {label}
      </span>
      <span className="flex items-center gap-1.5">
        {control}
        {right}
        {!control && !right && (
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="rgb(var(--text3))" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M9 6l6 6-6 6"/>
          </svg>
        )}
      </span>
    </div>
  );
}
