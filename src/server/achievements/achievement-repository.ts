import "server-only";
import { prisma } from "@/server/db/prisma";
import type { AchievementCounts } from "@/lib/achievements/evaluate";

// "Невезучий" (раздел 21 ТЗ): последние 2 рулетки, в которых пользователь
// участвовал, обе выиграны им же — сравниваем participant.id с
// result.winnerParticipantId в хронологическом порядке закрытия.
async function checkPickedTwiceInARow(userId: string): Promise<boolean> {
  const recent = await prisma.sessionParticipant.findMany({
    where: { userId, session: { type: "ROULETTE", status: "RESOLVED" } },
    orderBy: { session: { closedAt: "desc" } },
    take: 2,
    select: { id: true, session: { select: { result: { select: { winnerParticipantId: true } } } } },
  });

  return recent.length === 2 && recent.every((row) => row.session.result?.winnerParticipantId === row.id);
}

export async function getAchievementCounts(userId: string): Promise<AchievementCounts> {
  const [rouletteWins, votesCast, debatesCreated, randomChoiceCreated, aiVerdictsCreated, pickedTwiceInARow] =
    await Promise.all([
      prisma.result.count({ where: { winnerParticipant: { userId } } }),
      prisma.vote.count({ where: { userId } }),
      prisma.session.count({ where: { creatorId: userId, type: "DEBATE" } }),
      prisma.session.count({ where: { creatorId: userId, type: "RANDOM_CHOICE" } }),
      prisma.session.count({ where: { creatorId: userId, type: "AI_VERDICT", status: "RESOLVED" } }),
      checkPickedTwiceInARow(userId),
    ]);

  return { rouletteWins, votesCast, debatesCreated, randomChoiceCreated, aiVerdictsCreated, pickedTwiceInARow };
}
