"use client";

import { useEffect, useState } from "react";

interface DecimalInputProps {
  value:        number;
  onChange:     (value: number) => void;
  min?:         number;
  max?:         number;
  /** Called when the user presses Enter. */
  onEnter?:     () => void;
  className?:   string;
  style?:       React.CSSProperties;
  placeholder?: string;
  disabled?:    boolean;
}

/**
 * Controlled decimal input that behaves well on a Telegram mobile keypad:
 *  - lets the user fully clear the field while editing (no sticky "0")
 *  - accepts both "," and "." as the decimal separator (TG numeric keypads emit ",")
 *  - clamps to [min, max] on blur and never emits NaN
 *
 * Stores the raw text locally so intermediate states like "" or "2." are allowed;
 * the parent only ever receives a finite number.
 */
export function DecimalInput({
  value, onChange, min, max, onEnter, className, style, placeholder, disabled,
}: DecimalInputProps) {
  const [text, setText] = useState(() => (value ? String(value) : ""));

  // Re-sync when the value changes from outside (e.g. a requote) and the current
  // text doesn't already represent it — so external updates win without clobbering
  // an in-progress edit like "2.".
  useEffect(() => {
    const parsed = parseFloat(text.replace(",", "."));
    if (parsed !== value) setText(value ? String(value) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw: string) => {
    // Normalise comma → dot, strip anything but digits and a single dot.
    let s = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    setText(s);

    if (s === "" || s === ".") { onChange(0); return; }
    let n = parseFloat(s);
    if (Number.isNaN(n)) return;
    if (max != null && n > max) { n = max; setText(String(n)); }
    onChange(n);
  };

  const handleBlur = () => {
    const n = parseFloat(text.replace(",", "."));
    if (Number.isNaN(n) || text === "") {
      const fallback = min ?? 0;
      setText(fallback ? String(fallback) : "");
      onChange(fallback);
    } else if (min != null && n < min) {
      setText(String(min));
      onChange(min);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => { if (e.key === "Enter" && onEnter) onEnter(); }}
      className={className}
      style={style}
    />
  );
}
