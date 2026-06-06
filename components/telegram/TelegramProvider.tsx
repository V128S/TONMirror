"use client";

/**
 * Detects Telegram Mini App environment.
 * If window.Telegram.WebApp is absent (browser dev), loads a mock user.
 * Exposes TelegramContext consumed by useTelegramUser / useTelegramTheme / useTelegramViewport.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setInitData } from "@/lib/telegram-init";

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
  height:         number;
  stableHeight:   number;
  isExpanded:     boolean;
  isFullscreen:   boolean;
}

interface TelegramContextValue {
  isReady:         boolean;
  isTelegram:      boolean;
  user:            TelegramUser | null;
  theme:           TelegramTheme;
  viewport:        TelegramViewport;
  initData:        string;
  expand():        void;
  close():         void;
  requestFullscreen(): void;
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
  isFullscreen: false,
};

const MOCK_USER: TelegramUser = {
  id:           12345,
  username:     "demo_user",
  firstName:    "Demo",
  lastName:     "User",
  languageCode: "en",
};

const DEFAULT_CTX: TelegramContextValue = {
  isReady:             false,
  isTelegram:          false,
  user:                null,
  theme:               DARK_THEME,
  viewport:            DEFAULT_VIEWPORT,
  initData:            "",
  expand:              () => {},
  close:               () => {},
  requestFullscreen:   () => {},
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
      // Expose the signed initData so API hooks can authenticate requests.
      setInitData(tg.initData ?? null);

      // CRITICAL ORDER: expand first, then requestFullscreen, then ready().
      // Telegram shows the Mini App at the moment ready() is called.
      // Calling expand() before ready() means the app is revealed already at full height.
      tg.expand();

      // Newer Bot API methods not present in the installed WebApp typings.
      const tgx = tg as unknown as {
        requestFullscreen?: () => void;
        isFullscreen?: boolean;
        safeAreaInset?:        { top?: number; bottom?: number; left?: number; right?: number };
        contentSafeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
        onEvent?: (event: string, cb: () => void) => void;
        offEvent?: (event: string, cb: () => void) => void;
      };

      // Telegram doesn't reliably expose the safe-area as CSS vars, so read the
      // JS insets and set --app-top-inset ourselves. In fullscreen the top inset
      // = device status bar (safeAreaInset.top) + Telegram's button row
      // (contentSafeAreaInset.top), which pushes our ticker below the Close/menu
      // controls. Falls back to the CSS env() value (globals.css) when unset.
      const applyInsets = () => {
        const safeTop    = tgx.safeAreaInset?.top ?? 0;
        const contentTop = tgx.contentSafeAreaInset?.top ?? 0;
        const top = safeTop + contentTop;
        if (top > 0) {
          document.documentElement.style.setProperty("--app-top-inset", `${top}px`);
        }
      };
      applyInsets();
      [300, 800].forEach((d) => setTimeout(applyInsets, d));

      const tryFullscreen = () => {
        if (typeof tgx.requestFullscreen === "function") {
          try { tgx.requestFullscreen(); } catch { /* ignore */ }
        }
      };
      tryFullscreen();

      tg.ready(); // ← signals Telegram to reveal the Mini App (already expanded)

      // Belt-and-suspenders: retry fullscreen after chrome animation settles
      const t1 = setTimeout(tryFullscreen, 300);
      const t2 = setTimeout(tryFullscreen, 800);

      const getViewport = (): TelegramViewport => ({
        height:       tg.viewportHeight,
        stableHeight: tg.viewportStableHeight,
        isExpanded:   tg.isExpanded,
        isFullscreen: !!tgx.isFullscreen,
      });

      const update = () =>
        setCtx({
          isReady:    true,
          isTelegram: true,
          user:       parseTelegramUser(tg),
          theme:      parseTelegramTheme(tg),
          viewport:   getViewport(),
          initData:   tg.initData,
          expand:     () => tg.expand(),
          close:      () => tg.close(),
          requestFullscreen: () => {
            if (typeof tgx.requestFullscreen === "function") {
              try { tgx.requestFullscreen(); } catch { /* ignore */ }
            } else {
              tg.expand();
            }
          },
        });

      update();
      tg.onEvent("viewportChanged",    update);
      tg.onEvent("themeChanged",       update);
      // Safe-area + fullscreen events available in newer Bot API versions
      const onInsetEvent = () => { update(); applyInsets(); };
      if (typeof tgx.onEvent === "function") {
        try {
          tgx.onEvent("fullscreenChanged",      onInsetEvent);
          tgx.onEvent("safeAreaChanged",        applyInsets);
          tgx.onEvent("contentSafeAreaChanged", applyInsets);
        } catch { /* ignore */ }
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        tg.offEvent("viewportChanged", update);
        tg.offEvent("themeChanged",    update);
        try {
          tgx.offEvent?.("fullscreenChanged",      onInsetEvent);
          tgx.offEvent?.("safeAreaChanged",        applyInsets);
          tgx.offEvent?.("contentSafeAreaChanged", applyInsets);
        } catch { /* ignore */ }
      };
    } else {
      // Dev / browser fallback — mock user, actual window height
      setInitData(null);
      setCtx({
        isReady:           true,
        isTelegram:        false,
        user:              MOCK_USER,
        theme:             DARK_THEME,
        viewport: {
          height:       window.innerHeight,
          stableHeight: window.innerHeight,
          isExpanded:   true,
          isFullscreen: true,
        },
        initData:          "",
        expand:            () => {},
        close:             () => {},
        requestFullscreen: () => {},
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
