import { randomInt } from "node:crypto";
import { getAIProvider } from "@/server/ai/get-ai-provider";
import { assertWithinDailyAiLimit, recordAiRequest } from "@/server/ai/rate-limit";
import { SIDE_LETTERS } from "@/server/ai/prompt";
import type { AiTone } from "@/lib/ai/tones";
import { resolvePoll, type PollOption } from "./poll";
import type { ResolvedResult } from "./types";

// Безопасный набор шаблонов для голосования людей (раздел 9 ТЗ) — сам текст
// решения формулирует наш код, а не пользователи, поэтому его можно
// заранее проверить на неприемлемые формулировки.
const DEBATE_VOTE_TEMPLATES = [
  "Апелляция отклонена.",
  "Дело закрыто, вопросы неуместны.",
  "Большинство высказалось — обжалованию не подлежит.",
  "Проигравшая сторона официально обязана заткнуться.",
  "Народный суд решил окончательно.",
  "Приговор в силе, пересмотру не подлежит.",
];

export async function resolveDebateVote(sessionId: string, options: PollOption[]): Promise<ResolvedResult> {
  const base = await resolvePoll(sessionId, options);
  const verdictLine = DEBATE_VOTE_TEMPLATES[randomInt(0, DEBATE_VOTE_TEMPLATES.length)]!;

  return {
    ...base,
    payload: { mode: "vote", ...(base.payload as Record<string, unknown>), verdictLine },
  };
}

export interface DebateOption {
  id: string;
  label: string;
  argument: string | null;
}

export async function resolveDebateJudge(
  session: { creatorId: string; title: string; options: DebateOption[] },
  tone: AiTone,
): Promise<ResolvedResult> {
  await assertWithinDailyAiLimit(session.creatorId);

  const sides = session.options.map((option, index) => ({
    letter: SIDE_LETTERS[index]!,
    id: option.id,
    name: option.label,
    argument: option.argument ?? "",
  }));

  const provider = getAIProvider();
  const startedAt = Date.now();

  try {
    const verdict = await provider.judgeDebate({
      question: session.title,
      sides: sides.map(({ letter, name, argument }) => ({ id: letter, name, argument })),
      tone,
    });

    if (verdict.refused) {
      await recordAiRequest(session.creatorId, "REFUSED", Date.now() - startedAt);
      return {
        payload: { mode: "ai", refused: true, headline: "", reasoning: "", sentence: "", confidence: 0 },
      };
    }

    const winner = sides.find((side) => side.letter === verdict.winnerId);
    if (!winner) {
      throw new Error("AI returned an unknown winnerId");
    }

    await recordAiRequest(session.creatorId, "SUCCESS", Date.now() - startedAt);
    return {
      winnerOptionId: winner.id,
      payload: {
        mode: "ai",
        refused: false,
        headline: verdict.headline,
        reasoning: verdict.reasoning,
        sentence: verdict.sentence,
        confidence: verdict.confidence,
      },
    };
  } catch (error) {
    await recordAiRequest(session.creatorId, "ERROR", Date.now() - startedAt);
    throw error;
  }
}
