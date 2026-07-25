import { describe, expect, it } from "vitest";
import {
  buildVerdictSystemPrompt,
  buildVerdictUserMessage,
  buildDebateJudgeSystemPrompt,
  buildDebateJudgeUserMessage,
} from "./prompt";

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

describe("buildDebateJudgeSystemPrompt", () => {
  it("embeds the requested tone", () => {
    expect(buildDebateJudgeSystemPrompt("Сарказм")).toContain("Сарказм");
  });

  it("always includes the safety rules regardless of tone", () => {
    const prompt = buildDebateJudgeSystemPrompt("Бабушка");
    expect(prompt).toContain("refused");
    expect(prompt).toContain("насилие");
  });

  it("requires the debate verdict fields in the format description", () => {
    const prompt = buildDebateJudgeSystemPrompt("Судья");
    for (const field of ["winnerId", "headline", "reasoning", "sentence", "confidence"]) {
      expect(prompt).toContain(field);
    }
  });
});

describe("buildDebateJudgeUserMessage", () => {
  it("includes the question and every side with its letter and argument", () => {
    const message = buildDebateJudgeUserMessage("Кто моет посуду?", [
      { id: "A", name: "Макс", argument: "Я вчера мыл" },
      { id: "B", name: "Лёха", argument: "Я покупал еду" },
    ]);

    expect(message).toContain("Кто моет посуду?");
    expect(message).toContain("A) Макс");
    expect(message).toContain("Я вчера мыл");
    expect(message).toContain("B) Лёха");
    expect(message).toContain("Я покупал еду");
  });
});
