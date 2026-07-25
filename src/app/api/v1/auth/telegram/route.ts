import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/config/env";
import { validateInitData, type TelegramInitDataUser } from "@/server/auth/telegram-init-data";
import { upsertUserFromTelegram } from "@/server/auth/user-repository";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { serializeUser } from "@/server/auth/serialize-user";
import { ApiError, errorResponse } from "@/server/http/errors";

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const bodySchema = z.union([
  z.object({ initData: z.string().min(1) }),
  z.object({ dev: z.literal(true) }),
]);

function resolveDevTelegramUser(): TelegramInitDataUser {
  const id = Number(env.DEV_TELEGRAM_USER_ID);
  if (!Number.isInteger(id)) {
    throw new ApiError(500, "DEV_AUTH_MISCONFIGURED", "DEV_TELEGRAM_USER_ID must be a valid integer");
  }

  return { id, first_name: "Dev", username: "dev_user" };
}

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsedBody = bodySchema.safeParse(json);
  if (!parsedBody.success) {
    return errorResponse(new ApiError(400, "INVALID_BODY", "Request body is invalid"));
  }

  let telegramUser: TelegramInitDataUser;

  try {
    if ("dev" in parsedBody.data) {
      if (!env.ALLOW_DEV_AUTH) {
        return errorResponse(new ApiError(403, "DEV_AUTH_DISABLED", "Dev auth bypass is disabled"));
      }
      telegramUser = resolveDevTelegramUser();
    } else {
      const result = validateInitData(parsedBody.data.initData, env.TELEGRAM_BOT_TOKEN);
      if (!result.ok) {
        return errorResponse(
          new ApiError(401, `INIT_DATA_${result.reason}`, "Telegram initData validation failed"),
        );
      }
      telegramUser = result.data.user;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error);
    }
    throw error;
  }

  const user = await upsertUserFromTelegram(telegramUser);
  const token = createSessionToken(user.id);

  const response = NextResponse.json({ user: serializeUser(user) });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return response;
}
