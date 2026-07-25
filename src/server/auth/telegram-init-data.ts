import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// Валидация Telegram initData — https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// Чистая функция без побочных эффектов: токен бота передаётся параметром,
// секреты нигде здесь напрямую не читаются — это упрощает тестирование.

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
  language_code: z.string().optional(),
});

export type TelegramInitDataUser = z.infer<typeof telegramUserSchema>;

export interface ValidatedInitData {
  user: TelegramInitDataUser;
  authDate: number;
}

export type InitDataValidationResult =
  | { ok: true; data: ValidatedInitData }
  | { ok: false; reason: "MALFORMED" | "MISSING_HASH" | "INVALID_SIGNATURE" | "EXPIRED" | "MISSING_USER" };

function computeHash(dataCheckString: string, botToken: string): string {
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  return createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
}

function hashesMatch(expectedHex: string, actualHex: string): boolean {
  const expected = Buffer.from(expectedHex, "hex");
  const actual = Buffer.from(actualHex, "hex");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export interface ValidateInitDataOptions {
  /** Максимальный возраст initData в секундах. По умолчанию 24 часа. */
  maxAgeSeconds?: number;
  /** Для тестов: подменяет "текущее время" (unix seconds). */
  now?: number;
}

export function validateInitData(
  initDataRaw: string,
  botToken: string,
  options: ValidateInitDataOptions = {},
): InitDataValidationResult {
  const maxAgeSeconds = options.maxAgeSeconds ?? 24 * 60 * 60;
  const now = options.now ?? Math.floor(Date.now() / 1000);

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(initDataRaw);
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  const hash = params.get("hash");
  if (!hash) {
    return { ok: false, reason: "MISSING_HASH" };
  }

  const entries: [string, string][] = [];
  for (const [key, value] of params.entries()) {
    if (key !== "hash") {
      entries.push([key, value]);
    }
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join("\n");

  const expectedHash = computeHash(dataCheckString, botToken);
  if (!hashesMatch(expectedHash, hash)) {
    return { ok: false, reason: "INVALID_SIGNATURE" };
  }

  const authDateRaw = params.get("auth_date");
  const authDate = authDateRaw ? Number(authDateRaw) : NaN;
  if (!Number.isFinite(authDate)) {
    return { ok: false, reason: "MALFORMED" };
  }

  if (now - authDate > maxAgeSeconds) {
    return { ok: false, reason: "EXPIRED" };
  }

  const userRaw = params.get("user");
  if (!userRaw) {
    return { ok: false, reason: "MISSING_USER" };
  }

  let userJson: unknown;
  try {
    userJson = JSON.parse(userRaw);
  } catch {
    return { ok: false, reason: "MALFORMED" };
  }

  const parsedUser = telegramUserSchema.safeParse(userJson);
  if (!parsedUser.success) {
    return { ok: false, reason: "MALFORMED" };
  }

  return { ok: true, data: { user: parsedUser.data, authDate } };
}
