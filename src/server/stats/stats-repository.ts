import "server-only";
import { prisma } from "@/server/db/prisma";

export interface UserStats {
  sessionsCreated: number;
  sessionsParticipated: number;
  rouletteWins: number;
}

// Только entertainment-статистика (раздел 20 ТЗ) — намеренно не выдаём
// "побед/поражений" в спорах и AI-вердиктах, пока этих режимов нет
// (Этапы 11-12). Раздутые метрики хуже отсутствующих.
export async function getUserStats(userId: string): Promise<UserStats> {
  const [sessionsCreated, rouletteWins, createdRows, participantRows, voteRows] = await Promise.all([
    prisma.session.count({ where: { creatorId: userId } }),
    prisma.result.count({ where: { winnerParticipant: { userId } } }),
    prisma.session.findMany({ where: { creatorId: userId }, select: { id: true } }),
    prisma.sessionParticipant.findMany({ where: { userId }, select: { sessionId: true } }),
    prisma.vote.findMany({ where: { userId }, select: { sessionId: true }, distinct: ["sessionId"] }),
  ]);

  const participatedIds = new Set<string>();
  for (const row of createdRows) participatedIds.add(row.id);
  for (const row of participantRows) participatedIds.add(row.sessionId);
  for (const row of voteRows) participatedIds.add(row.sessionId);

  return {
    sessionsCreated,
    sessionsParticipated: participatedIds.size,
    rouletteWins,
  };
}
