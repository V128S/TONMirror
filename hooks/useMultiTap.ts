"use client";

import { useCallback, useRef } from "react";

/**
 * Returns a tap handler that fires `onTrigger` once it's invoked `taps` times
 * within `windowMs`. Used for the hidden gesture that toggles the terminal theme
 * (5 quick taps on the app logo). The counter resets after the window lapses.
 */
export function useMultiTap(onTrigger: () => void, taps = 5, windowMs = 1200) {
  const state = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  return useCallback(() => {
    const s = state.current;
    if (s.timer) clearTimeout(s.timer);
    s.count += 1;
    if (s.count >= taps) {
      s.count = 0;
      onTrigger();
      return;
    }
    s.timer = setTimeout(() => { s.count = 0; }, windowMs);
  }, [onTrigger, taps, windowMs]);
}
