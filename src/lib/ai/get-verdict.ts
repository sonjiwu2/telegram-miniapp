import type { PublicSession } from "@/lib/types/session";

export interface VerdictPayload {
  refused: boolean;
  headline: string;
  verdict: string;
  reasoning: string;
  sentence: string;
}

function isVerdictPayload(value: unknown): value is VerdictPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.refused === "boolean" &&
    typeof candidate.headline === "string" &&
    typeof candidate.verdict === "string" &&
    typeof candidate.reasoning === "string" &&
    typeof candidate.sentence === "string"
  );
}

// Result.payload для AI_VERDICT хранит Verdict целиком (см. src/server/ai/types.ts).
export function getVerdict(session: PublicSession): VerdictPayload | null {
  if (session.type !== "AI_VERDICT" || !session.result) {
    return null;
  }
  return isVerdictPayload(session.result.payload) ? session.result.payload : null;
}
