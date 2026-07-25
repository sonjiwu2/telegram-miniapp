// Минимальный typed-срез официального Telegram WebApp API, который используется
// на Этапе 1 (bootstrap). Расширять по мере необходимости, не выдумывая методы:
// https://core.telegram.org/bots/webapps

export type TelegramColorScheme = "light" | "dark";

export interface TelegramThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
}

export interface TelegramWebAppInitDataUnsafe {
  start_param?: string;
}

export interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  colorScheme: TelegramColorScheme;
  themeParams: TelegramThemeParams;
  initData: string;
  initDataUnsafe: TelegramWebAppInitDataUnsafe;
  // Открывает t.me-ссылку внутри Telegram, Mini App при этом не закрывается
  // (начиная с Bot API 7.0). Используется для share-ссылок.
  openTelegramLink: (url: string) => void;
  onEvent: (eventType: "themeChanged", callback: () => void) => void;
  offEvent: (eventType: "themeChanged", callback: () => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.Telegram?.WebApp ?? null;
}
