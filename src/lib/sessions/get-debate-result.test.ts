import { describe, expect, it } from "vitest";
import { getDebateResult } from "./get-debate-result";
import type { PublicSession } from "@/lib/types/session";

function baseSession(overrides: Partial<PublicSession>): PublicSession {
  return {
    id: "s1",
    type: "DEBATE",
    status: "RESOLVED",
    title: "Кто моет посуду?",
    settings: {},
    creatorId: "u1",
    participants: [],
    options: [],
    result: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe("getDebateResult", () => {
  it("returns null for a non-DEBATE session", () => {
    expect(getDebateResult(baseSession({ type: "POLL", result: { winnerOptionId: null, winnerParticipantId: null, payload: { mode: "vote" }, createdAt: "" } }))).toBeNull();
  });

  it("returns null when there is no result yet", () => {
    expect(getDebateResult(baseSession({ result: null }))).toBeNull();
  });

  it("parses a vote-mode payload", () => {
    const session = baseSession({
      result: {
        winnerOptionId: "o1",
        winnerParticipantId: null,
        createdAt: "",
        payload: { mode: "vote", counts: { o1: 3, o2: 1 }, totalVotes: 4, tie: false, verdictLine: "Апелляция отклонена." },
      },
    });
    const result = getDebateResult(session);
    expect(result?.mode).toBe("vote");
  });

  it("parses an ai-mode payload", () => {
    const session = baseSession({
      result: {
        winnerOptionId: "o1",
        winnerParticipantId: null,
        createdAt: "",
        payload: { mode: "ai", refused: false, headline: "ПОБЕДИТЕЛЬ: АНТОН", reasoning: "...", sentence: "...", confidence: 80 },
      },
    });
    const result = getDebateResult(session);
    expect(result?.mode).toBe("ai");
  });

  it("returns null for a malformed payload", () => {
    const session = baseSession({
      result: { winnerOptionId: null, winnerParticipantId: null, createdAt: "", payload: { mode: "vote" } },
    });
    expect(getDebateResult(session)).toBeNull();
  });
});
