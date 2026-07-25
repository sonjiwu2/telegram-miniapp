import type { Prisma } from "@/generated/prisma/client";

export interface ResolvedResult {
  winnerParticipantId?: string;
  winnerOptionId?: string;
  payload: Prisma.InputJsonObject;
}
