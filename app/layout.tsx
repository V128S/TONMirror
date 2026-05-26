import type { Metadata } from "next";
import { JetBrains_Mono, Major_Mono_Display, Share_Tech_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const jet = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-jet",
  display: "swap",
});

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${jet.variable} ${maj.variable} ${sht.variable} antialiased bg-bg`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
