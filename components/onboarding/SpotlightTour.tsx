"use client";

import { useState, useEffect } from "react";

interface TourStep {
  targetSelector: string;
  title: string;
  body: string;
  placement: "top" | "bottom";
}

interface SpotlightTourProps {
  onComplete: () => void;
}

const STEPS: TourStep[] = [
  { targetSelector: '[data-tour="tab-mirror"]',    title: "Mirror",         body: "Incoming signals from all followed leaders in real time.", placement: "top" },
  { targetSelector: '[data-tour="tab-market"]',    title: "Discover",       body: "Browse top leaders and find wallets worth following.", placement: "top" },
  { targetSelector: '[data-tour="tab-activity"]',  title: "Activity",       body: "Full trade history, copy decisions and execution status.", placement: "top" },
  { targetSelector: '[data-tour="tab-settings"]',  title: "Settings",       body: "Theme, strategy config and demo controls.", placement: "bottom" },
  { targetSelector: '[data-tour="connect-wallet"]',title: "Connect Wallet", body: "Connect your TON wallet to start copy-trading.", placement: "bottom" },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightTour({ onComplete }: SpotlightTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect]       = useState<TargetRect | null>(null);
  // Viewport size tracked in state to avoid SSR/hydration mismatch
  const [vp, setVp]           = useState<{ w: number; h: number } | null>(null);

  const step = STEPS[stepIdx];

  // Track actual viewport dimensions on the client only
  useEffect(() => {
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Measure target element whenever step changes.
  // Retries via rAF if element not yet in DOM (e.g. tab bar still rendering).
  useEffect(() => {
    if (!step) { setRect(null); return; }
    const selector = step.targetSelector;
    let rafId: number;

    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        // Element not mounted yet — retry next frame
        rafId = requestAnimationFrame(measure);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const remeasure = () => {
      const el = document.querySelector(selector);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    measure();
    window.addEventListener("resize", remeasure, { passive: true });
    window.addEventListener("scroll", remeasure, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure);
    };
  }, [step?.targetSelector]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!step) return null;

  const advance = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else onComplete();
  };

  const vw  = vp?.w ?? 390;
  const vh  = vp?.h ?? 844;
  const pad = 6;

  // Build clip-path polygon that cuts a rectangular hole in the overlay
  let clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)";
  if (rect) {
    const x1 = Math.max(0, rect.left - pad);
    const y1 = Math.max(0, rect.top - pad);
    const x2 = Math.min(vw, rect.left + rect.width + pad);
    const y2 = Math.min(vh, rect.top + rect.height + pad);
    clipPath = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${x1}px ${y1}px, ${x1}px ${y2}px, ${x2}px ${y2}px, ${x2}px ${y1}px, ${x1}px ${y1}px
    )`;
  }

  // Tooltip position
  const TOOLTIP_W = 260;
  const TOOLTIP_H = 120;
  let tooltipTop  = vh / 2 - TOOLTIP_H / 2;
  let tooltipLeft = vw / 2 - TOOLTIP_W / 2;
  if (rect) {
    tooltipTop  = step.placement === "top"
      ? rect.top - TOOLTIP_H - 12
      : rect.top + rect.height + 12;
    tooltipLeft = Math.max(12, Math.min(vw - TOOLTIP_W - 12, rect.left + rect.width / 2 - TOOLTIP_W / 2));
    // Clamp vertically
    if (tooltipTop < 12) tooltipTop = 12;
    if (tooltipTop + TOOLTIP_H > vh - 12) tooltipTop = vh - TOOLTIP_H - 12;
  }

  return (
    <div className="fixed inset-0 z-[300]" onClick={advance} style={{ cursor: "pointer" }}>
      {/* Dark overlay with cutout hole */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.65)", clipPath, pointerEvents: "none" }}
      />

      {/* Tooltip card */}
      <div
        className="absolute"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_W,
          background: "rgba(255,255,255,0.96)",
          borderRadius: 16,
          padding: "14px 16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
          pointerEvents: "none",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0c", marginBottom: 6 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 12, color: "#5e5e64", lineHeight: 1.5 }}>
          {step.body}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#9a9aa2" }}>
          {stepIdx + 1} / {STEPS.length} — tap anywhere to continue
        </div>
      </div>
    </div>
  );
}
