import { describe, expect, it } from "vitest";
import { getPollTally } from "./get-poll-tally";
import type { PublicSession } from "@/lib/types/session";

function baseSession(overrides: Partial<PublicSession> = {}): PublicSession {
  return {
    id: "session-1",
    type: "POLL",
    status: "RESOLVED",
    title: "Что смотрим?",
    settings: {},
    creatorId: "user-1",
    participants: [],
    options: [
      { id: "a", label: "Комедию" },
      { id: "b", label: "Ужасы" },
    ],
    result: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    closedAt: null,
    ...overrides,
  };
}

describe("getPollTally", () => {
  it("returns null when the session type is not POLL", () => {
    expect(getPollTally(baseSession({ type: "ROULETTE" }))).toBeNull();
  });

  it("returns null when there is no result yet", () => {
    expect(getPollTally(baseSession({ result: null }))).toBeNull();
  });

  it("returns the tally when the payload matches the expected shape", () => {
    const session = baseSession({
      result: {
        winnerParticipantId: null,
        winnerOptionId: "a",
        payload: { counts: { a: 3, b: 1 }, totalVotes: 4, tie: false },
        createdAt: "",
      },
    });

    expect(getPollTally(session)).toEqual({ counts: { a: 3, b: 1 }, totalVotes: 4, tie: false });
  });

  it("returns null when the payload does not match the expected shape", () => {
    const session = baseSession({
      result: { winnerParticipantId: null, winnerOptionId: null, payload: { foo: "bar" }, createdAt: "" },
    });

    expect(getPollTally(session)).toBeNull();
  });
});
