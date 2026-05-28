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
          tg-init.js is a static file served from /public.
          A synchronous <script src> in <head> (no async/defer) runs before
          any other JavaScript — including React. In Next.js App Router,
          metadata-derived <head> tags land in the HTML shell, whereas
          next/script components end up in the RSC streaming payload (too late).
          This is the earliest possible injection point.

          The script calls expand() → requestFullscreen() → ready() in order.
          Telegram reveals the Mini App exactly when ready() fires, so calling
          expand() first ensures it opens at full height with no half-screen flash.
        */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/tg-init.js" />
      </head>
      <body className={`${jet.variable} ${maj.variable} ${sht.variable} antialiased`}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
