import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Major_Mono_Display, Share_Tech_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

// JetBrains Mono — tabular numeric data in glass UI + terminal body text
const jet = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jet",
  display: "swap",
});

// Terminal-only display fonts (kept for the legacy theme)
const maj = Major_Mono_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-maj",
  display: "swap",
});

const sht = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-sht",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TonMirror",
  description: "Copy the alpha of TON's best traders — automatically, inside Telegram.",
};

export const viewport: Viewport = {
  // viewport-fit=cover enables env(safe-area-inset-*) on iOS notch/Dynamic Island
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning because ThemeProvider injects pre-hydration
    // script that may add .dark / .theme-terminal before React mounts.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          tg-init.js is injected into the real HTML <head> by middleware.ts
          (see /middleware.ts).  It cannot be placed here via JSX because in
          Next.js App Router all JSX — including <head> children — goes through
          the RSC streaming payload and is executed only after React hydration
          (same timing as useEffect).  The middleware intercepts the HTML
          response and patches <script src="/tg-init.js"> before </head>
          so it runs synchronously, before any React code.
        */}
      </head>
      <body className={`${jet.variable} ${maj.variable} ${sht.variable} antialiased`}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
