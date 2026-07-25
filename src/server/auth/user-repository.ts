import "server-only";
import { prisma } from "@/server/db/prisma";
import type { TelegramInitDataUser } from "./telegram-init-data";

export async function upsertUserFromTelegram(telegramUser: TelegramInitDataUser) {
  const telegramId = BigInt(telegramUser.id);

  return prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      photoUrl: telegramUser.photo_url,
      languageCode: telegramUser.language_code,
    },
    update: {
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name,
      username: telegramUser.username,
      photoUrl: telegramUser.photo_url,
      languageCode: telegramUser.language_code,
    },
  });
}
