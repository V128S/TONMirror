import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./modules/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ── Glass / semantic palette (CSS-var driven) ──────────────────────
        // Reference CSS variables defined in app/globals.css so light/dark
        // (and any future themes) can swap them without rebuild.
        bg:     "rgb(var(--bg) / <alpha-value>)",
        fg:     "rgb(var(--text1) / <alpha-value>)",
        muted:  "rgb(var(--text2) / <alpha-value>)",
        subtle: "rgb(var(--text3) / <alpha-value>)",
        faint:  "rgb(var(--text4) / <alpha-value>)",
        hair:   "rgb(var(--hair) / <alpha-value>)",

        // ── Terminal / phosphor palette (static) ──────────────────────────
        // These are kept so all existing terminal components still compile.
        phos: {
          DEFAULT: "#00ff66",
          hi:      "#c8ffd8",
          soft:    "#00ffaa",
          dim:     "#0a3d1f",
          mid:     "#4a8a5e",
        },
        "phos-border":     "rgba(0,255,102,0.35)",
        "phos-border-dim": "rgba(0,255,102,0.15)",

        warn:    "#b58200",
        danger:  "#a03040",
        success: "rgb(var(--text1) / <alpha-value>)",

        // Glass aliases used by Badge/Button/Card components.
        // In terminal theme these resolve to phos equivalents via the CSS var fallback.
        "glass-success": { DEFAULT: "#00ffaa" },

        // ── Legacy aliases ─────────────────────────────────────────────────
        ton: {
          50:  "#e6fff0",
          100: "#b3ffd9",
          400: "#00ffaa",
          500: "#00ff66",
          600: "#00cc52",
          900: "#0a3d1f",
        },
        teal: {
          400: "#00ffaa",
          500: "#00cc88",
        },
        surface: {
          0:   "#000000",
          1:   "#03070a",
          2:   "#06120c",
          3:   "#0a1a14",
          border: "rgba(0,255,102,0.18)",
        },
        text: {
          primary:   "#c8ffd8",
          secondary: "#00ffaa",
          muted:     "#4a8a5e",
        },
      },
      fontFamily: {
        // Glass: system font stack
        sans: ["-apple-system","BlinkMacSystemFont","SF Pro Text","SF Pro Display","Inter","system-ui","sans-serif"],
        // Shared mono — JetBrains Mono for numeric data in glass, terminal font for terminal
        mono: ["var(--font-jet)","SF Mono","ui-monospace","monospace"],
        // Terminal-only fonts (kept for backward compat)
        disp: ["var(--font-maj)", "var(--font-jet)", "monospace"],
        stm:  ["var(--font-sht)", "var(--font-jet)", "monospace"],
      },
      borderRadius: {
        // Glass defaults — smooth rounded corners
        DEFAULT: "14px",
        none: "0",
        sm:   "10px",
        md:   "14px",
        lg:   "18px",
        xl:   "22px",
        "2xl":"26px",
        "3xl":"32px",
        full: "9999px",
      },
      screens: {
        xs: "375px",
        sm: "430px",
      },
      boxShadow: {
        // Glass surface shadow
        glass:
          "0 1px 0 0 rgb(var(--glass-inner, 255 255 255) / 0.9) inset, " +
          "0 0 0 0.5px rgb(0 0 0 / 0.05), " +
          "0 8px 28px -8px rgb(20 20 40 / 0.10), " +
          "0 2px 6px -2px rgb(20 20 40 / 0.05)",
        // CTA button shadow (same as glass port)
        cta:
          "0 8px 22px -6px rgb(0 0 0 / 0.30), " +
          "0 1px 0 rgb(255 255 255 / 0.15) inset",
        // Terminal glow shadows (kept for backward compat)
        glow:      "0 0 6px rgba(0,255,102,0.6), 0 0 16px rgba(0,255,102,0.3)",
        "glow-sm": "0 0 4px rgba(0,255,102,0.5)",
        "glow-lg": "0 0 12px rgba(0,255,102,0.7), 0 0 32px rgba(0,255,102,0.35)",
        "panel-inset": "inset 0 0 24px rgba(0,255,102,0.06)",
      },
      letterSpacing: {
        wider2:  "0.18em",
        widest2: "0.25em",
      },
    },
  },
  plugins: [],
};

export default config;
