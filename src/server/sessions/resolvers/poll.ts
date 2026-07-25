import { prisma } from "@/server/db/prisma";
import type { ResolvedResult } from "./types";

export interface PollOption {
  id: string;
}

// Чистая часть — считает победителя по сырым счётчикам, без БД. Нормализует
// counts до полного набора опций (включая нулевые), чтобы UI мог показать
// 0% для вариантов без единого голоса. Ничья (несколько вариантов с
// одинаковым максимумом > 0) — winnerOptionId не выставляется, но полный
// tally всё равно уходит в payload.
export function computePollResult(options: PollOption[], rawCounts: Record<string, number>): ResolvedResult {
  const counts: Record<string, number> = {};
  for (const option of options) {
    counts[option.id] = rawCounts[option.id] ?? 0;
  }

  let winnerOptionId: string | undefined;
  let maxVotes = 0;
  let tie = false;

  for (const option of options) {
    const count = counts[option.id]!;
    if (count > maxVotes) {
      maxVotes = count;
      winnerOptionId = option.id;
      tie = false;
    } else if (count === maxVotes && count > 0) {
      tie = true;
    }
  }

  const totalVotes = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    winnerOptionId: tie ? undefined : winnerOptionId,
    payload: { counts, totalVotes, tie },
  };
}

export async function resolvePoll(sessionId: string, options: PollOption[]): Promise<ResolvedResult> {
  const tally = await prisma.vote.groupBy({
    by: ["optionId"],
    where: { sessionId },
    _count: { _all: true },
  });

  const rawCounts: Record<string, number> = {};
  for (const row of tally) {
    rawCounts[row.optionId] = row._count._all;
  }

  return computePollResult(options, rawCounts);
}
