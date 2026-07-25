import { describe, expect, it } from "vitest";
import { buildVerdictSystemPrompt, buildVerdictUserMessage } from "./prompt";

describe("buildVerdictSystemPrompt", () => {
  it("embeds the requested tone", () => {
    const prompt = buildVerdictSystemPrompt("Сарказм");
    expect(prompt).toContain("Сарказм");
  });

  it("always includes the safety rules regardless of tone", () => {
    const prompt = buildVerdictSystemPrompt("Бабушка");
    expect(prompt).toContain("refused");
    expect(prompt).toContain("насилие");
  });

  it("requires the four verdict fields in the format description", () => {
    const prompt = buildVerdictSystemPrompt("Судья");
    for (const field of ["headline", "verdict", "reasoning", "sentence"]) {
      expect(prompt).toContain(field);
    }
  });
});

describe("buildVerdictUserMessage", () => {
  it("wraps the situation text", () => {
    expect(buildVerdictUserMessage("Антон опоздал")).toContain("Антон опоздал");
  });
});
