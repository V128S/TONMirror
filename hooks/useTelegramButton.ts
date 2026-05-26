"use client";

/**
 * useTelegramMainButton — управляет нативной зелёной кнопкой Telegram Mini App.
 *
 * Эта кнопка появляется внизу приложения поверх контента.
 * Доступна только внутри Telegram (isTelegram === true).
 *
 * Пример:
 *   useTelegramMainButton({ text: "FOLLOW", onClick: handleFollow, visible: !isFollowing })
 */
import { useEffect } from "react";

interface MainButtonOptions {
  text:     string;
  onClick:  () => void;
  visible?: boolean;
  /** Hex цвет кнопки. По умолчанию — зелёный Telegram */
  color?:   string;
  /** Hex цвет текста. По умолчанию — белый */
  textColor?: string;
  disabled?: boolean;
}

interface SecondaryButtonOptions {
  text:     string;
  onClick:  () => void;
  visible?: boolean;
  /** Hex цвет. По умолчанию серый */
  color?:   string;
  textColor?: string;
}

export function useTelegramMainButton(opts: MainButtonOptions) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return; // браузер — кнопки не нужны

    const btn = tg.MainButton;

    if (opts.visible === false) {
      btn.hide();
      return () => { btn.offClick(opts.onClick); };
    }

    btn.setText(opts.text);
    if (opts.color)     btn.setParams({ color: opts.color, text_color: opts.textColor ?? "#ffffff" });
    if (opts.disabled)  btn.disable(); else btn.enable();

    btn.onClick(opts.onClick);
    btn.show();

    return () => {
      btn.offClick(opts.onClick);
      btn.hide();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.text, opts.visible, opts.color, opts.disabled]);
}

export function useTelegramSecondaryButton(opts: SecondaryButtonOptions) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    // SecondaryButton доступен с Bot API 7.10+
    const btn = tg?.SecondaryButton;
    if (!tg || !btn) return;

    if (opts.visible === false) {
      btn.hide();
      return () => { btn.offClick(opts.onClick); };
    }

    btn.setText(opts.text);
    if (opts.color) btn.setParams({ color: opts.color, text_color: opts.textColor ?? "#ffffff" });
    btn.onClick(opts.onClick);
    btn.show();

    return () => {
      btn.offClick(opts.onClick);
      btn.hide();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.text, opts.visible, opts.color]);
}

/** Показывает нативный pop-up с кнопками подтверждения */
export function useTelegramConfirm() {
  return (message: string, callback: (confirmed: boolean) => void) => {
    const tg = window.Telegram?.WebApp;
    if (!tg) {
      callback(window.confirm(message));
      return;
    }
    tg.showConfirm(message, callback);
  };
}
