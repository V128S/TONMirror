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
        // TON blue accent
        ton: {
          50:  "#e6f2ff",
          100: "#b3d9ff",
          400: "#3b9eff",
          500: "#0088cc",
          600: "#006faa",
          900: "#002b45",
        },
        // Teal accent (secondary)
        teal: {
          400: "#2dd4bf",
          500: "#14b8a6",
        },
        // Dark UI surfaces (Telegram-like)
        surface: {
          0:   "#0e1117",   // page background
          1:   "#161b22",   // card
          2:   "#1f2633",   // elevated card
          3:   "#2a3347",   // hover / active
          border: "#2d3748",
        },
        text: {
          primary:   "#e2e8f0",
          secondary: "#8b96a9",
          muted:     "#5a6478",
        },
        success: "#22c55e",
        warning: "#f59e0b",
        danger:  "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
      screens: {
        // Mobile-first only — no lg/xl assumptions
        xs: "375px",
        sm: "430px",
      },
    },
  },
  plugins: [],
};

export default config;
