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
          Run as early as possible — before React hydration.
          Calls expand() to fill available height immediately (no half-screen flash),
          then requestFullscreen() to remove the Telegram chrome header entirely.
          Uses optional chaining so it silently no-ops in a browser dev environment.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var tg=window.Telegram&&window.Telegram.WebApp;if(!tg)return;tg.ready();tg.expand();if(typeof tg.requestFullscreen==="function")tg.requestFullscreen();}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${jet.variable} ${maj.variable} ${sht.variable} antialiased`}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
