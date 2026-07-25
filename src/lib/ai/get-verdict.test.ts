import { describe, expect, it } from "vitest";
import { getVerdict } from "./get-verdict";
import type { PublicSession } from "@/lib/types/session";

function baseSession(overrides: Partial<PublicSession> = {}): PublicSession {
  return {
    id: "session-1",
    type: "AI_VERDICT",
    status: "RESOLVED",
    title: "Антон опоздал на встречу",
    settings: { tone: "Судья" },
    creatorId: "user-1",
    participants: [],
    options: [],
    result: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe("getVerdict", () => {
  it("returns null for non AI_VERDICT sessions", () => {
    expect(getVerdict(baseSession({ type: "ROULETTE" }))).toBeNull();
  });

  it("returns null when there is no result yet", () => {
    expect(getVerdict(baseSession({ result: null }))).toBeNull();
  });

  it("returns the verdict when the payload matches", () => {
    const session = baseSession({
      result: {
        winnerParticipantId: null,
        winnerOptionId: null,
        createdAt: "",
        payload: {
          refused: false,
          headline: "ВИНОВЕН: АНТОН",
          verdict: "Антон виновен",
          reasoning: "Потому что опоздал",
          sentence: "Заказывает пиццу",
        },
      },
    });

    expect(getVerdict(session)).toEqual({
      refused: false,
      headline: "ВИНОВЕН: АНТОН",
      verdict: "Антон виновен",
      reasoning: "Потому что опоздал",
      sentence: "Заказывает пиццу",
    });
  });

  it("returns null when the payload does not match the expected shape", () => {
    const session = baseSession({
      result: { winnerParticipantId: null, winnerOptionId: null, createdAt: "", payload: { foo: "bar" } },
    });

    expect(getVerdict(session)).toBeNull();
  });
});
