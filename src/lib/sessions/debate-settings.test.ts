import { describe, expect, it } from "vitest";
import { readDebateSettings, computeDebateClosesAt, isDebateJudgeMode } from "./debate-settings";

describe("isDebateJudgeMode", () => {
  it("accepts vote and ai", () => {
    expect(isDebateJudgeMode("vote")).toBe(true);
    expect(isDebateJudgeMode("ai")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isDebateJudgeMode("something")).toBe(false);
    expect(isDebateJudgeMode(undefined)).toBe(false);
  });
});

describe("readDebateSettings", () => {
  it("defaults to vote mode with no duration when settings are empty", () => {
    expect(readDebateSettings({})).toEqual({ judge: "vote", tone: undefined, durationMinutes: null });
  });

  it("reads a valid ai judge mode with tone", () => {
    expect(readDebateSettings({ judge: "ai", tone: "Сарказм" })).toEqual({
      judge: "ai",
      tone: "Сарказм",
      durationMinutes: null,
    });
  });

  it("falls back to vote mode for an invalid judge value", () => {
    expect(readDebateSettings({ judge: "coin-flip" }).judge).toBe("vote");
  });

  it("reads a numeric duration", () => {
    expect(readDebateSettings({ judge: "vote", durationMinutes: 30 }).durationMinutes).toBe(30);
  });
});

describe("computeDebateClosesAt", () => {
  it("returns null when there is no start time", () => {
    expect(computeDebateClosesAt(null, 30)).toBeNull();
  });

  it("returns null when there is no duration", () => {
    expect(computeDebateClosesAt(new Date(), null)).toBeNull();
  });

  it("adds the duration in minutes to the start time", () => {
    const startedAt = new Date("2026-01-01T00:00:00.000Z");
    const closesAt = computeDebateClosesAt(startedAt, 30);
    expect(closesAt?.toISOString()).toBe("2026-01-01T00:30:00.000Z");
  });
});
