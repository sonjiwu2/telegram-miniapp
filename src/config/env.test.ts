import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/reshala",
  NEXT_PUBLIC_APP_URL: "https://reshala.app",
};

describe("parseEnv", () => {
  it("parses a valid minimal environment", () => {
    const env = parseEnv(baseEnv);

    expect(env.DATABASE_URL).toBe(baseEnv.DATABASE_URL);
    expect(env.NEXT_PUBLIC_APP_URL).toBe(baseEnv.NEXT_PUBLIC_APP_URL);
    expect(env.NODE_ENV).toBe("development");
    expect(env.ALLOW_DEV_AUTH).toBe(false);
  });

  it("rejects a missing DATABASE_URL", () => {
    const rest = { NEXT_PUBLIC_APP_URL: baseEnv.NEXT_PUBLIC_APP_URL };

    expect(() => parseEnv(rest)).toThrow();
  });

  it("rejects a non-url DATABASE_URL", () => {
    expect(() =>
      parseEnv({ ...baseEnv, DATABASE_URL: "not-a-url" }),
    ).toThrow();
  });

  it("forbids ALLOW_DEV_AUTH=true in production", () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: "production",
        ALLOW_DEV_AUTH: "true",
      }),
    ).toThrow(/ALLOW_DEV_AUTH/);
  });

  it("allows ALLOW_DEV_AUTH=true outside production", () => {
    const env = parseEnv({
      ...baseEnv,
      NODE_ENV: "development",
      ALLOW_DEV_AUTH: "true",
    });

    expect(env.ALLOW_DEV_AUTH).toBe(true);
  });
});
