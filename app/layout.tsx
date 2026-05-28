import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Major_Mono_Display, Share_Tech_Mono } from "next/font/google";
import Script from "next/script";
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
      <body className={`${jet.variable} ${maj.variable} ${sht.variable} antialiased`}>
        {/*
          next/script strategy="beforeInteractive" is injected into <head> by Next.js
          and runs BEFORE React hydration — the earliest possible JS execution point.

          The script retries on DOMContentLoaded / window load in case Telegram injects
          window.Telegram.WebApp asynchronously (observed on some Android builds).
        */}
        {/*
          CRITICAL ORDER: expand() → requestFullscreen() → ready()
          Telegram hides its loading spinner and SHOWS the Mini App exactly when ready() fires.
          By calling expand() FIRST (before ready()), the app appears already at full height —
          the user never sees the half-screen "peek" state.
          requestFullscreen() (Bot API 8.0) removes the Telegram chrome bar as well.
        */}
        <Script id="tg-expand" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
(function(){
  function doExpand(){
    try{
      var tg=window.Telegram&&window.Telegram.WebApp;
      if(!tg)return false;
      tg.expand();
      if(typeof tg.requestFullscreen==="function")tg.requestFullscreen();
      tg.ready();
      return true;
    }catch(e){return false;}
  }
  if(!doExpand()){
    document.addEventListener("DOMContentLoaded",doExpand,{once:true});
    window.addEventListener("load",doExpand,{once:true});
  }
})();
        ` }} />
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
