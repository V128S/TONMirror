"use client";

import { useState } from "react";

interface WelcomeScreensProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    icon: "◆",
    title: "Copy the best traders\non TON — automatically.",
    body: "TonMirror зеркалирует сделки топовых кошельков прямо в твой. Никакого трейдинга вручную.",
  },
  {
    icon: "👁",
    title: "Follow a Leader",
    body: "Изучи статистику, риск-скор и историю сделок. Один тап — и ты следишь за лидером.",
  },
  {
    icon: "⚡",
    title: "Auto or Manual",
    body: "Подтверждай каждую сделку вручную или дай стратегии работать автоматом.",
  },
];

export function WelcomeScreens({ onComplete }: WelcomeScreensProps) {
  const [idx, setIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const next = () => {
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else onComplete();
  };
  const skip = () => onComplete();

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const delta = touchStartX - e.changedTouches[0].clientX;
    if (delta > 50 && idx < SLIDES.length - 1) setIdx(idx + 1);
    if (delta < -50 && idx > 0) setIdx(idx - 1);
    setTouchStartX(null);
  };

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;



  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col"
      style={{ background: "rgb(var(--bg))" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <div className="flex justify-end px-5 pt-12">
        <button
          onClick={skip}
          style={{ color: "rgb(var(--text3))", fontSize: 14 }}
          className="py-1 px-2"
        >
          Пропустить
        </button>
      </div>

      {/* Card content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div style={{ fontSize: 64, lineHeight: 1 }}>{slide.icon}</div>
        <div style={{ fontSize: 24, fontWeight: 700, color: "rgb(var(--text1))", lineHeight: 1.25, whiteSpace: "pre-line" }}>
          {slide.title}
        </div>
        <div style={{ fontSize: 15, color: "rgb(var(--text2))", lineHeight: 1.6, maxWidth: 300 }}>
          {slide.body}
        </div>
      </div>

      {/* Dots + Button */}
      <div className="flex flex-col items-center gap-6 px-8 pb-12">
        {/* Dot indicators */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 20 : 8,
                height: 8,
                borderRadius: 4,
                background: i === idx ? "rgb(var(--text1))" : "rgb(var(--text3))",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>

        {/* Next / Start button */}
        <button
          onClick={next}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "14px 0",
            borderRadius: 16,
            background: "rgb(var(--text1))",
            color: "rgb(var(--bg))",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          {isLast ? "Начать" : "Далее"}
        </button>
      </div>
    </div>
  );
}
