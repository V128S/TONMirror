import { TermStatusBar } from "@/components/terminal/TermStatusBar";
import { TermTabBar } from "@/components/terminal/TermTabBar";
import { Scanlines } from "@/components/fx/Scanlines";
import { Noise } from "@/components/fx/Noise";
import { Vignette } from "@/components/fx/Vignette";
import { SweepLine } from "@/components/fx/SweepLine";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-phos-hi tm-mono relative">
      {/* Phosphor status bar — sits at the very top (above safe area). */}
      <div className="relative h-[47px] z-30">
        <TermStatusBar />
      </div>

      {/* Page content — each page renders its own <TermHeader/>. */}
      <main className="pb-[80px]">{children}</main>

      {/* CRT overlays — fixed full-viewport, behind tab bar (z<50). */}
      <Scanlines opacity={0.22} />
      <Noise opacity={0.06} />
      <SweepLine />
      <Vignette />

      <TermTabBar />
    </div>
  );
}
