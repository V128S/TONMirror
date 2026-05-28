"use client";

import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass chrome ───────────────────────────────────────────────────────
import { GlassBackdrop }  from "@/components/glass/GlassBackdrop";
import { GlassTicker }    from "@/components/glass/GlassTicker";
import { GlassTabBar }    from "@/components/glass/GlassTabBar";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";

// ── Terminal chrome (legacy, unchanged) ───────────────────────────────
import { TermStatusBar } from "@/components/terminal/TermStatusBar";
import { TermTabBar }    from "@/components/terminal/TermTabBar";
import { Scanlines }     from "@/components/fx/Scanlines";
import { Noise }         from "@/components/fx/Noise";
import { Vignette }      from "@/components/fx/Vignette";
import { SweepLine }     from "@/components/fx/SweepLine";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  if (theme === "terminal") {
    return (
      <div className="min-h-screen bg-black text-phos-hi tm-mono relative">
        <div className="relative h-[47px] z-30">
          <TermStatusBar />
        </div>
        <main className="pb-[80px]">{children}</main>
        <Scanlines opacity={0.22} />
        <Noise opacity={0.06} />
        <SweepLine />
        <Vignette />
        <TermTabBar />
      </div>
    );
  }

  // Glass (light) and Glass-dark share the same chrome — the CSS vars handle colours.
  return (
    <div className="relative min-h-screen text-fg">
      <GlassBackdrop />
      <GlassTicker />
      {/* pt clears ticker (30px) + safe-area-inset-top for fullscreen mode; pb clears tab bar */}
      <main
        className="relative z-10 pb-[96px]"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 30px)" }}
      >
        {children}
      </main>
      <GlassTabBar />
      <OnboardingManager />
    </div>
  );
}
