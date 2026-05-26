"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/ThemeProvider";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet max height as % of viewport, default 70 */
  heightPercent?: number;
  className?: string;
}

/**
 * Slide-up panel. Dual-theme: glass surface (default) or terminal border.
 * Supports drag-to-dismiss (touch) and backdrop click.
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  heightPercent = 70,
  className,
}: BottomSheetProps) {
  const { theme } = useTheme();
  const isTerminal = theme === "terminal";

  const startY   = useRef<number | null>(null);
  const deltaY   = useRef<number>(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    deltaY.current = 0;
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

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sheetStyle: React.CSSProperties = isTerminal
    ? {
        background: "#000",
        borderTop:   "1px solid rgba(0,255,102,0.35)",
        borderLeft:  "1px solid rgba(0,255,102,0.20)",
        borderRight: "1px solid rgba(0,255,102,0.20)",
        borderRadius: 0,
        maxHeight: `${heightPercent}vh`,
      }
    : {
        background: "var(--glass-hi)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        backdropFilter: "blur(40px) saturate(180%)",
        borderTop:   "0.5px solid var(--glass-edge)",
        borderLeft:  "0.5px solid var(--glass-edge)",
        borderRight: "0.5px solid var(--glass-edge)",
        borderRadius: "24px 24px 0 0",
        maxHeight: `${heightPercent}vh`,
      };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[199] bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn("fixed bottom-0 left-0 right-0 z-[200] overflow-y-auto", className)}
        style={{
          ...sheetStyle,
          transition: "transform 300ms cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="rounded-full"
            style={{
              width: 36, height: 4,
              background: isTerminal ? "rgba(0,255,102,0.3)" : "rgba(0,0,0,0.15)",
            }}
          />
        </div>
        {children}
      </div>
    </>
  );
}
