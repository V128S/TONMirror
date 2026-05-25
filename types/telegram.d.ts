/**
 * Minimal Telegram Mini App WebApp type declarations.
 * Full types: https://core.telegram.org/bots/webapps
 */

interface TelegramWebAppUser {
  id:            number;
  first_name:    string;
  last_name?:    string;
  username?:     string;
  language_code?: string;
  photo_url?:    string;
  is_premium?:   boolean;
}

interface TelegramWebAppInitData {
  user?: TelegramWebAppUser;
  start_param?: string;
  auth_date?: number;
  hash?: string;
}

interface TelegramWebAppThemeParams {
  bg_color?:          string;
  text_color?:        string;
  hint_color?:        string;
  link_color?:        string;
  button_color?:      string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

type TelegramWebAppEventType =
  | "viewportChanged"
  | "themeChanged"
  | "mainButtonClicked"
  | "backButtonClicked"
  | "popupClosed"
  | "qrTextReceived"
  | "clipboardTextReceived"
  | "invoiceClosed"
  | "settingsButtonClicked";

interface TelegramWebApp {
  initData:            string;
  initDataUnsafe:      TelegramWebAppInitData;
  version:             string;
  platform:            string;
  colorScheme:         "light" | "dark";
  themeParams:         TelegramWebAppThemeParams;
  isExpanded:          boolean;
  viewportHeight:      number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  ready():             void;
  expand():            void;
  close():             void;
  onEvent(eventType: TelegramWebAppEventType, eventHandler: () => void): void;
  offEvent(eventType: TelegramWebAppEventType, eventHandler: () => void): void;
  sendData(data: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  showAlert(message: string, callback?: () => void): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  HapticFeedback: {
    impactOccurred(style: "light" | "medium" | "heavy" | "rigid" | "soft"): void;
    notificationOccurred(type: "error" | "success" | "warning"): void;
    selectionChanged(): void;
  };
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp;
  };
}
