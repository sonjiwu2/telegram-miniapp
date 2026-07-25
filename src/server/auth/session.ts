import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";

// Простая подписанная сессия в httpOnly cookie: base64url(payload).base64url(hmac).
// Без внешних JWT-библиотек — формат и алгоритм полностью под нашим контролем.

export const SESSION_COOKIE_NAME = "reshala_session";
const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 дней

export interface SessionPayload {
  userId: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string): string {
  return createHmac("sha256", env.SESSION_SECRET).update(value).digest("base64url");
}

export function createSessionToken(userId: string, now: number = Math.floor(Date.now() / 1000)): string {
  const payload: SessionPayload = { userId, iat: now, exp: now + SESSION_TTL_SECONDS };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(
  token: string,
  now: number = Math.floor(Date.now() / 1000),
): SessionPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  const actualBuffer = Buffer.from(signature, "base64url");
  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    return null;
  }

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
  } catch {
    return null;
  }

  if (typeof payload.userId !== "string" || typeof payload.exp !== "number") {
    return null;
  }

  if (now > payload.exp) {
    return null;
  }

  return payload;
}
