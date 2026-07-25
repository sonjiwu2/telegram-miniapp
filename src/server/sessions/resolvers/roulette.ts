import { randomInt } from "node:crypto";
import type { ResolvedResult } from "./types";

export interface RouletteParticipant {
  id: string;
  displayName: string;
}

// Криптографически стойкий выбор победителя. Никогда не Math.random() —
// результат авторитетный и определяется на сервере до любой анимации.
export function resolveRoulette(participants: RouletteParticipant[]): ResolvedResult {
  if (participants.length === 0) {
    throw new Error("resolveRoulette requires at least one participant");
  }

  const winnerIndex = randomInt(0, participants.length);
  const winner = participants[winnerIndex]!;

  return {
    winnerParticipantId: winner.id,
    payload: { winnerDisplayName: winner.displayName },
  };
}
