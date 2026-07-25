// Не импортирует "server-only" — используется и в клиентских компонентах
// (кнопка «Поделиться»), и на сервере (публичная result-страница, OG-мета).
// NEXT_PUBLIC_-переменные Next.js инлайнит в любой бандл на этапе сборки.

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

// https://core.telegram.org/bots/webapps#direct-link-mini-apps
// startapp допускает только A-Z a-z 0-9 _ - и не длиннее 64 символов —
// значению publicId (cuid) это условие удовлетворяет.
export function buildMiniAppLink(publicId: string): string {
  if (!BOT_USERNAME) {
    throw new Error("NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not configured");
  }

  return `https://t.me/${BOT_USERNAME}?startapp=${encodeURIComponent(publicId)}`;
}

export function buildTelegramShareLink(miniAppUrl: string, text: string): string {
  return `https://t.me/share/url?url=${encodeURIComponent(miniAppUrl)}&text=${encodeURIComponent(text)}`;
}
