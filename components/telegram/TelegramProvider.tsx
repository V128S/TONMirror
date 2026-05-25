"use client";

/**
 * Detects Telegram Mini App environment.
 * If window.Telegram.WebApp is absent (browser dev), loads a mock user.
 * Exposes TelegramContext consumed by useTelegramUser / useTelegramTheme / useTelegramViewport.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TelegramUser {
  id:           number;
  username?:    string;
  firstName:    string;
  lastName?:    string;
  photoUrl?:    string;
  languageCode?: string;
}

export interface TelegramTheme {
  colorScheme:     "dark" | "light";
  bgColor:         string;
  textColor:       string;
  hintColor:       string;
  linkColor:       string;
  buttonColor:     string;
  buttonTextColor: string;
}

export interface TelegramViewport {
  height:       number;
  stableHeight: number;
  isExpanded:   boolean;
}

interface TelegramContextValue {
  isReady:    boolean;
  isTelegram: boolean;
  user:       TelegramUser | null;
  theme:      TelegramTheme;
  viewport:   TelegramViewport;
  initData:   string;
  expand():   void;
  close():    void;
}

// ─── Static defaults (SSR-safe — no window reference) ────────────────────────

const DARK_THEME: TelegramTheme = {
  colorScheme:     "dark",
  bgColor:         "#0e1117",
  textColor:       "#e2e8f0",
  hintColor:       "#8b96a9",
  linkColor:       "#3b9eff",
  buttonColor:     "#0088cc",
  buttonTextColor: "#ffffff",
};

const DEFAULT_VIEWPORT: TelegramViewport = {
  height:       844,
  stableHeight: 844,
  isExpanded:   true,
};

const MOCK_USER: TelegramUser = {
  id:           12345,
  username:     "demo_user",
  firstName:    "Demo",
  lastName:     "User",
  languageCode: "en",
};

const DEFAULT_CTX: TelegramContextValue = {
  isReady:    false,
  isTelegram: false,
  user:       null,
  theme:      DARK_THEME,
  viewport:   DEFAULT_VIEWPORT,
  initData:   "",
  expand:     () => {},
  close:      () => {},
};

// ─── Context ──────────────────────────────────────────────────────────────────

const TelegramContext = createContext<TelegramContextValue>(DEFAULT_CTX);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTelegramUser(webApp: NonNullable<typeof window.Telegram>["WebApp"]): TelegramUser | null {
  const u = webApp.initDataUnsafe?.user;
  if (!u) return null;
  return {
    id:           u.id,
    username:     u.username,
    firstName:    u.first_name,
    lastName:     u.last_name,
    languageCode: u.language_code,
    photoUrl:     u.photo_url,
  };
}

function parseTelegramTheme(webApp: NonNullable<typeof window.Telegram>["WebApp"]): TelegramTheme {
  const tp = webApp.themeParams;
  return {
    colorScheme:     webApp.colorScheme as "dark" | "light",
    bgColor:         tp.bg_color          ?? DARK_THEME.bgColor,
    textColor:       tp.text_color         ?? DARK_THEME.textColor,
    hintColor:       tp.hint_color         ?? DARK_THEME.hintColor,
    linkColor:       tp.link_color         ?? DARK_THEME.linkColor,
    buttonColor:     tp.button_color       ?? DARK_THEME.buttonColor,
    buttonTextColor: tp.button_text_color  ?? DARK_THEME.buttonTextColor,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<TelegramContextValue>(DEFAULT_CTX);

  useEffect(() => {
    // Safe to access window here — we're inside useEffect (client only)
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();

      const update = () =>
        setCtx({
          isReady:    true,
          isTelegram: true,
          user:       parseTelegramUser(tg),
          theme:      parseTelegramTheme(tg),
          viewport: {
            height:       tg.viewportHeight,
            stableHeight: tg.viewportStableHeight,
            isExpanded:   tg.isExpanded,
          },
          initData: tg.initData,
          expand:   () => tg.expand(),
          close:    () => tg.close(),
        });

      update();
      tg.onEvent("viewportChanged", update);
      tg.onEvent("themeChanged",    update);

      return () => {
        tg.offEvent("viewportChanged", update);
        tg.offEvent("themeChanged",    update);
      };
    } else {
      // Dev / browser fallback — mock user, actual window height
      setCtx({
        isReady:    true,
        isTelegram: false,
        user:       MOCK_USER,
        theme:      DARK_THEME,
        viewport: {
          height:       window.innerHeight,
          stableHeight: window.innerHeight,
          isExpanded:   true,
        },
        initData: "",
        expand:   () => {},
        close:    () => {},
      });
    }
  }, []);

  // Force dark class on <html>
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <TelegramContext.Provider value={ctx}>
      {children}
    </TelegramContext.Provider>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useTelegram(): TelegramContextValue {
  return useContext(TelegramContext);
}

export function useTelegramUser(): TelegramUser | null {
  return useContext(TelegramContext).user;
}

export function useTelegramTheme(): TelegramTheme {
  return useContext(TelegramContext).theme;
}

export function useTelegramViewport(): TelegramViewport {
  return useContext(TelegramContext).viewport;
}
