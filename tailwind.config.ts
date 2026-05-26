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
        // ── Phosphor / terminal palette ──────────────────────────────────
        phos: {
          DEFAULT: "#00ff66",
          hi:      "#c8ffd8",
          soft:    "#00ffaa",
          dim:     "#0a3d1f",
          mid:     "#4a8a5e",
        },
        bg: {
          DEFAULT: "#000000",
          panel:   "#03070a",
          el:      "#06120c",
        },
        // alias `border-phos`, `border-phos-dim`
        "phos-border":     "rgba(0,255,102,0.35)",
        "phos-border-dim": "rgba(0,255,102,0.15)",

        // Status colors
        warn:    "#ffd500",
        danger:  "#ff3050",
        success: "#00ffaa",

        // ── Legacy aliases — keep so existing components still compile ──
        // (you can remove these once every consumer is migrated)
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
        mono: ["var(--font-jet)", "ui-monospace", "monospace"],
        disp: ["var(--font-maj)", "var(--font-jet)", "monospace"],
        stm:  ["var(--font-sht)", "var(--font-jet)", "monospace"],
        sans: ["var(--font-jet)", "ui-monospace", "monospace"],
      },
      fontFeatureSettings: {
        mono: '"tnum","zero","ss02"',
      },
      borderRadius: {
        none: "0",
        sm:   "2px",
        DEFAULT: "0",   // square corners by default — terminal aesthetic
        md:   "0",
        lg:   "0",
        xl:   "0",
        "2xl":"0",
        "3xl":"0",
        full: "9999px",
      },
      screens: {
        xs: "375px",
        sm: "430px",
      },
      boxShadow: {
        glow:     "0 0 6px rgba(0,255,102,0.6), 0 0 16px rgba(0,255,102,0.3)",
        "glow-sm":"0 0 4px rgba(0,255,102,0.5)",
        "glow-lg":"0 0 12px rgba(0,255,102,0.7), 0 0 32px rgba(0,255,102,0.35)",
        "panel-inset": "inset 0 0 24px rgba(0,255,102,0.06)",
      },
      letterSpacing: {
        wider2: "0.18em",
        widest2:"0.25em",
      },
    },
  },
  plugins: [],
};

export default config;
