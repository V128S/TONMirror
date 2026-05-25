import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title:       "TonMirror",
  description: "Copy-trade on TON — follow the best wallets",
  // Telegram Mini Apps should not be indexed
  robots:      "noindex",
};

export const viewport: Viewport = {
  width:               "device-width",
  initialScale:        1,
  maximumScale:        1,
  userScalable:        false,
  viewportFit:         "cover",
  themeColor:          "#0e1117",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
