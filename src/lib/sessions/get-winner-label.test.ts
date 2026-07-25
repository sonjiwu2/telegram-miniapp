import { describe, expect, it } from "vitest";
import { getWinnerLabel } from "./get-winner-label";
import type { PublicSession } from "@/lib/types/session";

function baseSession(overrides: Partial<PublicSession> = {}): PublicSession {
  return {
    id: "session-1",
    type: "ROULETTE",
    status: "OPEN",
    title: "Кто сегодня?",
    settings: {},
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

describe("getWinnerLabel", () => {
  it("returns null when there is no result", () => {
    expect(getWinnerLabel(baseSession())).toBeNull();
  });

  it("returns the participant's display name for a roulette result", () => {
    const session = baseSession({
      participants: [{ id: "p1", userId: null, displayName: "Антон" }],
      result: { winnerParticipantId: "p1", winnerOptionId: null, payload: {}, createdAt: "" },
    });

    expect(getWinnerLabel(session)).toBe("Антон");
  });

  it("returns the option's label for a random-choice result", () => {
    const session = baseSession({
      type: "RANDOM_CHOICE",
      options: [{ id: "o1", label: "Хинкали", argument: null }],
      result: { winnerParticipantId: null, winnerOptionId: "o1", payload: {}, createdAt: "" },
    });

    expect(getWinnerLabel(session)).toBe("Хинкали");
  });

  it("returns null when the referenced winner id is not found in the lists", () => {
    const session = baseSession({
      result: { winnerParticipantId: "missing", winnerOptionId: null, payload: {}, createdAt: "" },
    });

    expect(getWinnerLabel(session)).toBeNull();
  });
});
