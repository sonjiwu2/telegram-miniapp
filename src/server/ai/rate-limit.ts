import { prisma } from "@/server/db/prisma";
import { env } from "@/config/env";
import { AI_DAILY_FREE_LIMIT } from "@/config/limits";
import { ApiError } from "@/server/http/errors";
import type { AIRequestStatus } from "@/generated/prisma/client";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

// Общий дневной лимит на AI Вердикт и AI-судью (раздел 38 ТЗ) — оба режима
// пишут в одну и ту же таблицу AIRequest, поэтому и считаются вместе.
export async function assertWithinDailyAiLimit(userId: string): Promise<void> {
  const usedToday = await prisma.aIRequest.count({
    where: { userId, createdAt: { gte: startOfToday() }, status: { not: "ERROR" } },
  });

  if (usedToday >= AI_DAILY_FREE_LIMIT) {
    throw new ApiError(429, "AI_DAILY_LIMIT_REACHED", `Free limit is ${AI_DAILY_FREE_LIMIT} AI calls per day`);
  }
}

export async function recordAiRequest(userId: string, status: AIRequestStatus, latencyMs: number): Promise<void> {
  await prisma.aIRequest.create({
    data: {
      userId,
      provider: env.AI_PROVIDER ?? "unknown",
      model: env.AI_MODEL ?? "unknown",
      status,
      latencyMs,
    },
  });
}
