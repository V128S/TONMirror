"use client";

export function MicroToggle({
  on,
  onChange,
  size = "md",
}: {
  on: boolean;
  onChange?: (v: boolean) => void;
  size?: "sm" | "md";
}) {
  const dims =
    size === "sm"
      ? { w: 40, h: 24, knob: 20, off: 2, onLeft: 18 }
      : { w: 44, h: 26, knob: 22, off: 2, onLeft: 20 };
  return (
    <button
      type="button"
      onClick={() => onChange?.(!on)}
      className="relative shrink-0 rounded-full transition-colors"
      style={{
        width: dims.w,
        height: dims.h,
        background: on ? "rgb(var(--text1))" : "var(--chip)",
      }}
      aria-pressed={on}
    >
      <span
        className="absolute top-[2px] rounded-full transition-all"
        style={{
          width: dims.knob,
          height: dims.knob,
          left: on ? dims.onLeft : dims.off,
          background: on ? "rgb(var(--bg))" : "rgb(var(--text1))",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </button>
  );
}
