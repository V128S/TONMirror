"use client";

/**
 * Holds the current Telegram `initData` string so API hooks can attach it as the
 * `x-telegram-init-data` header for server-side verification. Set once by
 * TelegramProvider; null in the browser/dev fallback (no Telegram).
 */
let initData: string | null = null;

export function setInitData(value: string | null) {
  initData = value && value.length > 0 ? value : null;
}

export function getInitData(): string | null {
  return initData;
}

/** Spread into a fetch `headers` object to authenticate user-scoped requests. */
export function authHeaders(): Record<string, string> {
  return initData ? { "x-telegram-init-data": initData } : {};
}
