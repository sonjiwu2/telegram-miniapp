import { describe, expect, it } from "vitest";
import { canManageSession } from "./permissions";

describe("canManageSession", () => {
  it("allows the creator to manage the session", () => {
    expect(canManageSession({ creatorId: "user-1" }, "user-1")).toBe(true);
  });

  it("forbids anyone else", () => {
    expect(canManageSession({ creatorId: "user-1" }, "user-2")).toBe(false);
  });
});
