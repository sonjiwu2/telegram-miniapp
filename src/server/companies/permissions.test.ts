import { describe, expect, it } from "vitest";
import { canDeleteCompany, canManageMembers } from "./permissions";

describe("canManageMembers", () => {
  it("allows OWNER and ADMIN", () => {
    expect(canManageMembers("OWNER")).toBe(true);
    expect(canManageMembers("ADMIN")).toBe(true);
  });

  it("forbids MEMBER and non-members", () => {
    expect(canManageMembers("MEMBER")).toBe(false);
    expect(canManageMembers(null)).toBe(false);
  });
});

describe("canDeleteCompany", () => {
  it("allows only OWNER", () => {
    expect(canDeleteCompany("OWNER")).toBe(true);
    expect(canDeleteCompany("ADMIN")).toBe(false);
    expect(canDeleteCompany("MEMBER")).toBe(false);
    expect(canDeleteCompany(null)).toBe(false);
  });
});
