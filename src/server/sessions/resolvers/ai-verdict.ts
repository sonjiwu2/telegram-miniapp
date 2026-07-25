import { getAIProvider } from "@/server/ai/get-ai-provider";
import { assertWithinDailyAiLimit, recordAiRequest } from "@/server/ai/rate-limit";
import type { ResolvedResult } from "./types";

export async function resolveAiVerdict(userId: string, situation: string, tone: string): Promise<ResolvedResult> {
  await assertWithinDailyAiLimit(userId);

  const provider = getAIProvider();
  const startedAt = Date.now();

  try {
    const verdict = await provider.generateVerdict({ situation, tone });
    await recordAiRequest(userId, verdict.refused ? "REFUSED" : "SUCCESS", Date.now() - startedAt);
    return { payload: { ...verdict } };
  } catch (error) {
    await recordAiRequest(userId, "ERROR", Date.now() - startedAt);
    throw error;
  }
}
