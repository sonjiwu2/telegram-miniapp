import { describe, expect, it } from "vitest";
import { resolveRoulette } from "./roulette";

function makeParticipants(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `participant-${index}`,
    sessionId: "session-1",
    userId: null,
    displayName: `Участник ${index}`,
    joinedAt: new Date(),
  }));
}

describe("resolveRoulette", () => {
  it("throws when there are no participants", () => {
    expect(() => resolveRoulette([])).toThrow();
  });

  it("picks the only participant when there is exactly one", () => {
    const participants = makeParticipants(1);

    const result = resolveRoulette(participants);

    expect(result.winnerParticipantId).toBe(participants[0]!.id);
    expect(result.payload).toEqual({ winnerDisplayName: participants[0]!.displayName });
  });

  it("always picks a winner that belongs to the participant list", () => {
    const participants = makeParticipants(7);
    const validIds = new Set(participants.map((p) => p.id));

    for (let i = 0; i < 500; i++) {
      const result = resolveRoulette(participants);
      expect(validIds.has(result.winnerParticipantId)).toBe(true);
    }
  });

  it("eventually picks every participant across many trials (sanity check on distribution)", () => {
    const participants = makeParticipants(5);
    const seen = new Set<string>();

    for (let i = 0; i < 500; i++) {
      seen.add(resolveRoulette(participants).winnerParticipantId);
    }

    expect(seen.size).toBe(participants.length);
  });
});
