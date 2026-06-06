"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AppTheme = "glass" | "glass-dark" | "terminal";

interface Ctx {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  /** Toggle into terminal and back to the glass theme that was active before. */
  toggleTerminal: () => void;
  /** true when using glass light or glass-dark */
  isGlass: boolean;
  /** true when glass-dark or terminal (terminal uses dark bg) */
  isDark: boolean;
}

const ThemeCtx = createContext<Ctx | null>(null);
const KEY = "tonmirror-theme";
/** Remembers the glass theme to restore when leaving terminal. */
const PREV_GLASS_KEY = "tonmirror-prev-glass";

/**
 * Pre-hydration script: reads localStorage and applies classes BEFORE React
 * mounts so there's no theme flash on first load.
 *
 * Classes set by this script:
 *   - "dark" for glass-dark / terminal (dark backgrounds)
 *   - "theme-terminal" for the legacy terminal design
 *   No extra class needed for default glass-light (it's the baseline).
 */
const NO_FLASH_SCRIPT = `
  (function() {
    try {
      var t = localStorage.getItem('${KEY}') || 'glass';
      var el = document.documentElement;
      if (t === 'glass-dark') {
        el.classList.add('dark');
      } else if (t === 'terminal') {
        el.classList.add('dark', 'theme-terminal');
      }
    } catch (e) {}
  })();
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("glass");

  // Hydrate from class set by the inline pre-hydration script.
  useEffect(() => {
    const el = document.documentElement;
    const stored = (() => {
      try { return localStorage.getItem(KEY) as AppTheme | null; } catch { return null; }
    })();
    const resolved: AppTheme =
      stored === "glass" || stored === "glass-dark" || stored === "terminal"
        ? stored
        : "glass";
    setThemeState(resolved);
    applyClasses(el, resolved);
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    applyClasses(document.documentElement, t);
    try { localStorage.setItem(KEY, t); } catch {}
  }, []);

  // Terminal ⇄ glass toggle. Entering terminal stashes the current glass theme;
  // leaving restores it (defaults to light glass) — so the 5-tap gesture works
  // both ways and returns the user to whichever Light/Dark theme they had.
  const toggleTerminal = useCallback(() => {
    setThemeState((prev) => {
      let next: AppTheme;
      if (prev === "terminal") {
        const stored = (() => {
          try { return localStorage.getItem(PREV_GLASS_KEY) as AppTheme | null; } catch { return null; }
        })();
        next = stored === "glass" || stored === "glass-dark" ? stored : "glass";
      } else {
        try { localStorage.setItem(PREV_GLASS_KEY, prev); } catch {}
        next = "terminal";
      }
      applyClasses(document.documentElement, next);
      try { localStorage.setItem(KEY, next); } catch {}
      return next;
    });
  }, []);

  return (
    <>
      {/* Pre-hydration script prevents flash of wrong theme. */}
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      <ThemeCtx.Provider
        value={{
          theme,
          setTheme,
          toggleTerminal,
          isGlass: theme === "glass" || theme === "glass-dark",
          isDark: theme === "glass-dark" || theme === "terminal",
        }}
      >
        {children}
      </ThemeCtx.Provider>
    </>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

function applyClasses(el: HTMLElement, t: AppTheme) {
  el.classList.remove("dark", "theme-terminal");
  if (t === "glass-dark") {
    el.classList.add("dark");
  } else if (t === "terminal") {
    el.classList.add("dark", "theme-terminal");
  }
}
