import { describe, expect, it } from "vitest";
import { resolveRandomChoice } from "./random-choice";

function makeOptions(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `option-${index}`,
    label: `Вариант ${index}`,
  }));
}

describe("resolveRandomChoice", () => {
  it("throws when there are no options", () => {
    expect(() => resolveRandomChoice([])).toThrow();
  });

  it("always picks a winner that belongs to the option list", () => {
    const options = makeOptions(6);
    const validIds = new Set(options.map((option) => option.id));

    for (let i = 0; i < 500; i++) {
      const result = resolveRandomChoice(options);
      expect(result.winnerOptionId).toBeDefined();
      expect(validIds.has(result.winnerOptionId!)).toBe(true);
      expect(result.winnerParticipantId).toBeUndefined();
    }
  });

  it("eventually picks every option across many trials (sanity check on distribution)", () => {
    const options = makeOptions(4);
    const seen = new Set<string>();

    for (let i = 0; i < 400; i++) {
      seen.add(resolveRandomChoice(options).winnerOptionId!);
    }

    expect(seen.size).toBe(options.length);
  });
});
