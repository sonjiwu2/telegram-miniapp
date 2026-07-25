import type { SessionStatus } from "@/generated/prisma/client";

// Чистые функции состояний сессии — без побочных эффектов, чтобы их можно
// было тестировать без БД. Репозиторий обязан проверять их перед записью.

export function canJoin(status: SessionStatus): boolean {
  return status === "DRAFT" || status === "OPEN";
}

export function canStart(status: SessionStatus): boolean {
  return status === "DRAFT";
}

export function canClose(status: SessionStatus): boolean {
  return status === "OPEN";
}

export function canEditBeforeStart(status: SessionStatus): boolean {
  return status === "DRAFT";
}
