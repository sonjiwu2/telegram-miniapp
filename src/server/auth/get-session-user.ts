import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/server/db/prisma";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

// Центральная точка для получения текущего пользователя из cookie-сессии.
// Все защищённые роуты должны идти через неё, а не читать cookie напрямую.
export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return null;
  }

  return prisma.user.findUnique({ where: { id: payload.userId } });
}
