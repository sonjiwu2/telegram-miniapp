import { describe, expect, it } from "vitest";
import { AI_TONES, DEFAULT_AI_TONE, isAiTone } from "./tones";

describe("isAiTone", () => {
  it("accepts every declared tone", () => {
    for (const tone of AI_TONES) {
      expect(isAiTone(tone)).toBe(true);
    }
  });

  it("rejects unknown strings and non-strings", () => {
    expect(isAiTone("Весёлый пират")).toBe(false);
    expect(isAiTone(undefined)).toBe(false);
    expect(isAiTone(null)).toBe(false);
    expect(isAiTone(42)).toBe(false);
  });

  it("has a default tone that is itself a valid tone", () => {
    expect(isAiTone(DEFAULT_AI_TONE)).toBe(true);
  });
});
