import "server-only";
import { prisma } from "@/server/db/prisma";
import type { SessionType } from "@/generated/prisma/client";
import { sessionWithRelations } from "./session-repository";

export interface HistoryFilter {
  type?: SessionType;
  mineOnly?: boolean;
}

const HISTORY_LIMIT = 50;

// «Все» — сессии, где пользователь так или иначе участвовал (создал,
// присоединился как участник рулетки или проголосовал). «Мои» — только
// созданные им самим. Исторический результат не редактируется — просто
// читаем то, что уже сохранено при финализации.
export function getUserHistory(userId: string, filter: HistoryFilter = {}) {
  const typeFilter = filter.type ? { type: filter.type } : {};

  if (filter.mineOnly) {
    return prisma.session.findMany({
      where: { creatorId: userId, ...typeFilter },
      include: sessionWithRelations,
      orderBy: { createdAt: "desc" },
      take: HISTORY_LIMIT,
    });
  }

  return prisma.session.findMany({
    where: {
      ...typeFilter,
      OR: [{ creatorId: userId }, { participants: { some: { userId } } }, { votes: { some: { userId } } }],
    },
    include: sessionWithRelations,
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
}
