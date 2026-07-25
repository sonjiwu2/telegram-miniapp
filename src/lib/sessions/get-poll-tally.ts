import type { PublicSession } from "@/lib/types/session";

export interface PollTally {
  counts: Record<string, number>;
  totalVotes: number;
  tie: boolean;
}

function isPollTally(value: unknown): value is PollTally {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.counts === "object" &&
    candidate.counts !== null &&
    typeof candidate.totalVotes === "number" &&
    typeof candidate.tie === "boolean"
  );
}

// Result.payload для POLL хранит { counts, totalVotes, tie } — см.
// src/server/sessions/resolvers/poll.ts. Голоса появляются в payload
// только после финализации, до этого результаты никому не видны.
export function getPollTally(session: PublicSession): PollTally | null {
  if (session.type !== "POLL" || !session.result) {
    return null;
  }
  return isPollTally(session.result.payload) ? session.result.payload : null;
}
