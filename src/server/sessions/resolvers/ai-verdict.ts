import { prisma } from "@/server/db/prisma";
import { env } from "@/config/env";
import { AI_VERDICT_DAILY_FREE_LIMIT } from "@/config/limits";
import { getAIProvider } from "@/server/ai/get-ai-provider";
import { ApiError } from "@/server/http/errors";
import type { ResolvedResult } from "./types";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export async function resolveAiVerdict(userId: string, situation: string, tone: string): Promise<ResolvedResult> {
  const usedToday = await prisma.aIRequest.count({
    where: { userId, createdAt: { gte: startOfToday() }, status: { not: "ERROR" } },
  });

  if (usedToday >= AI_VERDICT_DAILY_FREE_LIMIT) {
    throw new ApiError(
      429,
      "AI_DAILY_LIMIT_REACHED",
      `Free limit is ${AI_VERDICT_DAILY_FREE_LIMIT} AI verdicts per day`,
    );
  }

  const provider = getAIProvider();
  const startedAt = Date.now();

  try {
    const verdict = await provider.generateVerdict({ situation, tone });

    await prisma.aIRequest.create({
      data: {
        userId,
        provider: env.AI_PROVIDER ?? "unknown",
        model: env.AI_MODEL ?? "unknown",
        status: verdict.refused ? "REFUSED" : "SUCCESS",
        latencyMs: Date.now() - startedAt,
      },
    });

    return { payload: { ...verdict } };
  } catch (error) {
    await prisma.aIRequest.create({
      data: {
        userId,
        provider: env.AI_PROVIDER ?? "unknown",
        model: env.AI_MODEL ?? "unknown",
        status: "ERROR",
        latencyMs: Date.now() - startedAt,
      },
    });

    throw error;
  }
}
