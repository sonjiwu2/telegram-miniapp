import type { PublicSession } from "@/lib/types/session";

export interface DebateVoteResult {
  mode: "vote";
  counts: Record<string, number>;
  totalVotes: number;
  tie: boolean;
  verdictLine: string;
}

export interface DebateAiResult {
  mode: "ai";
  refused: boolean;
  headline: string;
  reasoning: string;
  sentence: string;
  confidence: number;
}

export type DebateResult = DebateVoteResult | DebateAiResult;

function isDebateVoteResult(value: unknown): value is DebateVoteResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.mode === "vote" &&
    typeof candidate.counts === "object" &&
    candidate.counts !== null &&
    typeof candidate.totalVotes === "number" &&
    typeof candidate.tie === "boolean" &&
    typeof candidate.verdictLine === "string"
  );
}

function isDebateAiResult(value: unknown): value is DebateAiResult {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.mode === "ai" &&
    typeof candidate.refused === "boolean" &&
    typeof candidate.headline === "string" &&
    typeof candidate.reasoning === "string" &&
    typeof candidate.sentence === "string" &&
    typeof candidate.confidence === "number"
  );
}

// Result.payload для DEBATE — одна из двух форм в зависимости от settings.judge,
// см. src/server/sessions/resolvers/debate.ts.
export function getDebateResult(session: PublicSession): DebateResult | null {
  if (session.type !== "DEBATE" || !session.result) {
    return null;
  }

  const payload = session.result.payload;
  if (isDebateVoteResult(payload)) {
    return payload;
  }
  if (isDebateAiResult(payload)) {
    return payload;
  }
  return null;
}
