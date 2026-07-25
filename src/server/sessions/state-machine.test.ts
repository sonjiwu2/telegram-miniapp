import { describe, expect, it } from "vitest";
import { canClose, canEditBeforeStart, canJoin, canStart } from "./state-machine";

describe("session state machine", () => {
  it("allows joining only DRAFT and OPEN sessions", () => {
    expect(canJoin("DRAFT")).toBe(true);
    expect(canJoin("OPEN")).toBe(true);
    expect(canJoin("CLOSED")).toBe(false);
    expect(canJoin("RESOLVED")).toBe(false);
    expect(canJoin("CANCELLED")).toBe(false);
  });

  it("allows starting only DRAFT sessions", () => {
    expect(canStart("DRAFT")).toBe(true);
    expect(canStart("OPEN")).toBe(false);
    expect(canStart("CLOSED")).toBe(false);
  });

  it("allows closing only OPEN sessions", () => {
    expect(canClose("OPEN")).toBe(true);
    expect(canClose("DRAFT")).toBe(false);
    expect(canClose("CLOSED")).toBe(false);
  });

  it("allows editing only before start (DRAFT)", () => {
    expect(canEditBeforeStart("DRAFT")).toBe(true);
    expect(canEditBeforeStart("OPEN")).toBe(false);
  });
});
