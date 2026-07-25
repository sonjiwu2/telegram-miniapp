import { randomInt } from "node:crypto";
import type { ResolvedResult } from "./types";

export interface ChoiceOption {
  id: string;
  label: string;
}

// Криптографически стойкий выбор варианта — та же логика, что и в рулетке,
// но победитель здесь Option, а не SessionParticipant.
export function resolveRandomChoice(options: ChoiceOption[]): ResolvedResult {
  if (options.length === 0) {
    throw new Error("resolveRandomChoice requires at least one option");
  }

  const winnerIndex = randomInt(0, options.length);
  const winner = options[winnerIndex]!;

  return {
    winnerOptionId: winner.id,
    payload: { winnerLabel: winner.label },
  };
}
