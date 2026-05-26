"use client";

import { useState, useEffect, useCallback } from "react";

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
  { targetSelector: '[data-tour="tab-mirror"]',    title: "Live Feed",      body: "Все входящие сигналы от лидеров в реальном времени.", placement: "top" },
  { targetSelector: '[data-tour="tab-market"]',    title: "Market",         body: "Лидеры и лента сделок в одном месте.", placement: "top" },
  { targetSelector: '[data-tour="tab-portfolio"]', title: "Portfolio",      body: "Баланс кошелька, стратегии и PnL.", placement: "top" },
  { targetSelector: '[data-tour="tab-settings"]',  title: "Settings",       body: "Тема, стратегия и демо-режим.", placement: "top" },
  { targetSelector: '[data-tour="connect-wallet"]',title: "Connect Wallet", body: "Подключи кошелёк, чтобы начать копировать сделки.", placement: "bottom" },
];

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function SpotlightTour({ onComplete }: SpotlightTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);

  const step = STEPS[stepIdx];

  const measureTarget = useCallback(() => {
    const el = document.querySelector(step.targetSelector);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.targetSelector]);

  useEffect(() => {
    measureTarget();
    window.addEventListener("resize", measureTarget);
    return () => window.removeEventListener("resize", measureTarget);
  }, [measureTarget]);

  const advance = () => {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
    else onComplete();
  };

  const vw = typeof window !== "undefined" ? window.innerWidth : 390;
  const vh = typeof window !== "undefined" ? window.innerHeight : 844;
  const pad = 6;

  // Build clip-path polygon that cuts out a rectangle around the target
  let clipPath = "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"; // full overlay if no rect
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
  let tooltipTop = 0;
  let tooltipLeft = 0;
  if (rect) {
    if (step.placement === "top") {
      tooltipTop = rect.top - TOOLTIP_H - 12;
    } else {
      tooltipTop = rect.top + rect.height + 12;
    }
    tooltipLeft = Math.max(12, Math.min(vw - TOOLTIP_W - 12, rect.left + rect.width / 2 - TOOLTIP_W / 2));
    // Clamp top to screen
    if (tooltipTop < 12) tooltipTop = 12;
    if (tooltipTop + TOOLTIP_H > vh - 12) tooltipTop = vh - TOOLTIP_H - 12;
  } else {
    tooltipTop = vh / 2 - TOOLTIP_H / 2;
    tooltipLeft = vw / 2 - TOOLTIP_W / 2;
  }

  return (
    <div className="fixed inset-0 z-[300]" onClick={advance} style={{ cursor: "pointer" }}>
      {/* Dark overlay with hole */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.65)", clipPath, pointerEvents: "none" }}
      />

      {/* Tooltip */}
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
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0c", marginBottom: 6 }}>
          {step.title}
        </div>
        <div style={{ fontSize: 12, color: "#5e5e64", lineHeight: 1.5 }}>
          {step.body}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "#9a9aa2" }}>
          {stepIdx + 1} / {STEPS.length} — нажми куда угодно
        </div>
      </div>
    </div>
  );
}
