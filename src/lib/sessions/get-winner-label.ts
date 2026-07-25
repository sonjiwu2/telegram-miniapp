import type { PublicSession } from "@/lib/types/session";

// Победитель может быть участником (ROULETTE) либо вариантом (RANDOM_CHOICE) —
// эта функция скрывает разницу от вызывающего UI-кода.
export function getWinnerLabel(session: PublicSession): string | null {
  const result = session.result;
  if (!result) {
    return null;
  }

  if (result.winnerParticipantId) {
    return session.participants.find((p) => p.id === result.winnerParticipantId)?.displayName ?? null;
  }

  if (result.winnerOptionId) {
    return session.options.find((o) => o.id === result.winnerOptionId)?.label ?? null;
  }

  return null;
}
