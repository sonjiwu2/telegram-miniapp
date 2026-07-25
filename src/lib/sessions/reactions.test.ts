import { describe, expect, it } from "vitest";
import { REACTION_EMOJIS, isReactionEmoji } from "./reactions";

describe("isReactionEmoji", () => {
  it("accepts every emoji in the fixed set", () => {
    for (const emoji of REACTION_EMOJIS) {
      expect(isReactionEmoji(emoji)).toBe(true);
    }
  });

  it("rejects anything outside the fixed set", () => {
    expect(isReactionEmoji("👍")).toBe(false);
    expect(isReactionEmoji("laugh")).toBe(false);
    expect(isReactionEmoji(undefined)).toBe(false);
  });
});
