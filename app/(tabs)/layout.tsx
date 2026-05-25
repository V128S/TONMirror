import type { ReactNode } from "react";
import { TabBar } from "@/components/ui/TabBar";

/**
 * Shared layout for all tab screens.
 * Content scrolls above the fixed TabBar.
 */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Scrollable page content — leave space for TabBar (≈65px) */}
      <main className="flex-1 overflow-y-auto pb-20 scroll-hide">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
