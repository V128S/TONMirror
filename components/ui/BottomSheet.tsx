"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet max height as % of viewport, default 85 */
  heightPercent?: number;
  className?: string;
}

/**
 * Slide-up panel. Dual-theme: glass surface (default) or terminal border.
 * Supports drag-to-dismiss (touch) and backdrop click.
 * Maintains exit animation by keeping the DOM alive until transition ends.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  heightPercent = 85,
  className,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const isTerminal = theme === "terminal";

  // `visible` tracks whether the DOM is still mounted (delayed removal for exit animation)
  const [visible, setVisible] = useState(isOpen);

  const startY   = useRef<number | null>(null);
  const deltaY   = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Mount immediately when opening; delay unmount until exit animation finishes
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
    }
  }, [isOpen]);

  // Body scroll lock — save+restore previous value to compose with other locks
  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const handleTransitionEnd = () => {
    if (!isOpen) setVisible(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current  = e.touches[0].clientY;
    deltaY.current  = 0;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const d = e.touches[0].clientY - startY.current;
    deltaY.current = d;
    if (d > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${d}px)`;
    }
  };
  const handleTouchEnd = () => {
    if (deltaY.current > 80) {
      onClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    startY.current = null;
    deltaY.current = 0;
  };

  if (!visible) return null;

  // dvh (dynamic viewport height) adjusts when the browser chrome appears/hides;
  // important in Telegram Mini App. Fall back to standard vh via CSS custom property trick.
  const maxH = `${heightPercent}dvh`;

  const sheetStyle: React.CSSProperties = isTerminal
    ? {
        background:   "#000",
        borderTop:    "1px solid rgba(0,255,102,0.35)",
        borderLeft:   "1px solid rgba(0,255,102,0.20)",
        borderRight:  "1px solid rgba(0,255,102,0.20)",
        borderRadius: 0,
        maxHeight:    maxH,
        // Clear the floating tab bar (fixed bottom-5, ~72px tall) which otherwise
        // bleeds through this translucent sheet and hides the action buttons.
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
      }
    : {
        background:           "var(--glass-hi)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        backdropFilter:        "blur(40px) saturate(180%)",
        borderTop:    "0.5px solid var(--glass-edge)",
        borderLeft:   "0.5px solid var(--glass-edge)",
        borderRight:  "0.5px solid var(--glass-edge)",
        borderRadius: "24px 24px 0 0",
        maxHeight:    maxH,
        // Clear the floating tab bar (fixed bottom-5, ~72px tall) which otherwise
        // bleeds through this translucent sheet and hides the action buttons.
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 96px)",
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199] bg-black/40"
        style={{
          opacity:    isOpen ? 1 : 0,
          transition: "opacity 300ms ease",
        }}
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn("fixed bottom-0 left-0 right-0 z-[200] overflow-y-auto", className)}
        style={{
          ...sheetStyle,
          transform:  isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTransitionEnd={handleTransitionEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{
              width:      36,
              height:     4,
              background: isTerminal ? "rgba(0,255,102,0.3)" : "rgba(0,0,0,0.15)",
            }}
          />
        </div>
        {children}
      </div>
    </>
  );
}
