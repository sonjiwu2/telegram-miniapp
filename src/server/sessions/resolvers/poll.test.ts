import { describe, expect, it } from "vitest";
import { computePollResult } from "./poll";

const options = [{ id: "a" }, { id: "b" }, { id: "c" }];

describe("computePollResult", () => {
  it("picks the option with the most votes", () => {
    const result = computePollResult(options, { a: 1, b: 5, c: 2 });

    expect(result.winnerOptionId).toBe("b");
    expect(result.payload).toEqual({ counts: { a: 1, b: 5, c: 2 }, totalVotes: 8, tie: false });
  });

  it("leaves winnerOptionId unset on a tie", () => {
    const result = computePollResult(options, { a: 3, b: 3, c: 1 });

    expect(result.winnerOptionId).toBeUndefined();
    expect(result.payload).toMatchObject({ tie: true, totalVotes: 7 });
  });

  it("handles zero votes without crashing or declaring a winner", () => {
    const result = computePollResult(options, {});

    expect(result.winnerOptionId).toBeUndefined();
    expect(result.payload).toEqual({ counts: { a: 0, b: 0, c: 0 }, totalVotes: 0, tie: false });
  });

  it("handles a single option with votes", () => {
    const result = computePollResult([{ id: "only" }], { only: 4 });

    expect(result.winnerOptionId).toBe("only");
    expect(result.payload).toMatchObject({ tie: false, totalVotes: 4 });
  });
});
