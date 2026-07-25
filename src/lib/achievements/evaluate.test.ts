import { describe, expect, it } from "vitest";
import { evaluateAchievements, type AchievementCounts } from "./evaluate";

const ZERO_COUNTS: AchievementCounts = {
  rouletteWins: 0,
  votesCast: 0,
  debatesCreated: 0,
  randomChoiceCreated: 0,
  aiVerdictsCreated: 0,
  pickedTwiceInARow: false,
};

function unlockedCodes(counts: AchievementCounts): string[] {
  return evaluateAchievements(counts)
    .filter((a) => a.unlocked)
    .map((a) => a.code);
}

describe("evaluateAchievements", () => {
  it("unlocks nothing at zero counts", () => {
    expect(unlockedCodes(ZERO_COUNTS)).toEqual([]);
  });

  it("returns all six titles regardless of unlock state", () => {
    expect(evaluateAchievements(ZERO_COUNTS)).toHaveLength(6);
  });

  it("unlocks SYSTEM_VICTIM at exactly the threshold", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, rouletteWins: 5 })).toContain("SYSTEM_VICTIM");
    expect(unlockedCodes({ ...ZERO_COUNTS, rouletteWins: 4 })).not.toContain("SYSTEM_VICTIM");
  });

  it("unlocks UNLUCKY only from the boolean flag, not from rouletteWins", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, rouletteWins: 10, pickedTwiceInARow: false })).not.toContain("UNLUCKY");
    expect(unlockedCodes({ ...ZERO_COUNTS, pickedTwiceInARow: true })).toContain("UNLUCKY");
  });

  it("unlocks DEMOCRAT at 50 votes", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, votesCast: 50 })).toContain("DEMOCRAT");
  });

  it("unlocks TROUBLEMAKER at 20 debates created", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, debatesCreated: 20 })).toContain("TROUBLEMAKER");
  });

  it("unlocks COULDNT_CARE_LESS at 25 random-choice sessions", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, randomChoiceCreated: 25 })).toContain("COULDNT_CARE_LESS");
  });

  it("unlocks JUDGE_DREDD at 10 AI verdicts", () => {
    expect(unlockedCodes({ ...ZERO_COUNTS, aiVerdictsCreated: 10 })).toContain("JUDGE_DREDD");
  });
});
