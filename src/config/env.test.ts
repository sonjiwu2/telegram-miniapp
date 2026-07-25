import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const baseEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/reshala",
  NEXT_PUBLIC_APP_URL: "https://reshala.app",
  TELEGRAM_BOT_TOKEN: "123456:test-bot-token",
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: "reshala_test_bot",
  SESSION_SECRET: "a".repeat(32),
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
    const { DATABASE_URL, ...rest } = baseEnv;
    void DATABASE_URL;

    expect(() => parseEnv(rest)).toThrow();
  });

  it("rejects a non-url DATABASE_URL", () => {
    expect(() => parseEnv({ ...baseEnv, DATABASE_URL: "not-a-url" })).toThrow();
  });

  it("rejects a SESSION_SECRET shorter than 32 characters", () => {
    expect(() => parseEnv({ ...baseEnv, SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
  });

  it("rejects a missing TELEGRAM_BOT_TOKEN", () => {
    const { TELEGRAM_BOT_TOKEN, ...rest } = baseEnv;
    void TELEGRAM_BOT_TOKEN;

    expect(() => parseEnv(rest)).toThrow();
  });

  it("rejects a missing NEXT_PUBLIC_TELEGRAM_BOT_USERNAME", () => {
    const { NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, ...rest } = baseEnv;
    void NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

    expect(() => parseEnv(rest)).toThrow();
  });

  it("forbids ALLOW_DEV_AUTH=true in production", () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        NODE_ENV: "production",
        ALLOW_DEV_AUTH: "true",
        DEV_TELEGRAM_USER_ID: "1",
      }),
    ).toThrow(/ALLOW_DEV_AUTH/);
  });

  it("requires DEV_TELEGRAM_USER_ID when ALLOW_DEV_AUTH=true", () => {
    expect(() =>
      parseEnv({
        ...baseEnv,
        ALLOW_DEV_AUTH: "true",
      }),
    ).toThrow(/DEV_TELEGRAM_USER_ID/);
  });

  it("allows ALLOW_DEV_AUTH=true outside production with a dev user id", () => {
    const env = parseEnv({
      ...baseEnv,
      NODE_ENV: "development",
      ALLOW_DEV_AUTH: "true",
      DEV_TELEGRAM_USER_ID: "123",
    });

    expect(env.ALLOW_DEV_AUTH).toBe(true);
  });
});
