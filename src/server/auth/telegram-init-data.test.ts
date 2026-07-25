import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateInitData } from "./telegram-init-data";

const BOT_TOKEN = "123456:TEST-bot-token-for-unit-tests";

function signInitData(params: Record<string, string>, botToken: string): string {
  const dataCheckString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  return new URLSearchParams({ ...params, hash }).toString();
}

function validInitDataParams(overrides: Partial<Record<string, string>> = {}) {
  return {
    auth_date: String(Math.floor(Date.now() / 1000)),
    query_id: "AAEmnAcAAAAA",
    user: JSON.stringify({ id: 42, first_name: "Антон", username: "anton" }),
    ...overrides,
  };
}

describe("validateInitData", () => {
  it("accepts correctly signed, fresh initData", () => {
    const initData = signInitData(validInitDataParams(), BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.id).toBe(42);
      expect(result.data.user.username).toBe("anton");
    }
  });

  it("rejects data signed with a different bot token", () => {
    const initData = signInitData(validInitDataParams(), "999999:someone-elses-token");

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result).toEqual({ ok: false, reason: "INVALID_SIGNATURE" });
  });

  it("rejects tampered fields even if the hash was valid for the original data", () => {
    const initData = signInitData(validInitDataParams(), BOT_TOKEN);
    const tamperedParams = new URLSearchParams(initData);
    tamperedParams.set("user", JSON.stringify({ id: 999, first_name: "Hacker", username: "anton" }));

    const result = validateInitData(tamperedParams.toString(), BOT_TOKEN);

    expect(result).toEqual({ ok: false, reason: "INVALID_SIGNATURE" });
  });

  it("rejects initData without a hash", () => {
    const params = validInitDataParams();
    const initData = new URLSearchParams(params).toString();

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result).toEqual({ ok: false, reason: "MISSING_HASH" });
  });

  it("rejects expired initData", () => {
    const oldAuthDate = Math.floor(Date.now() / 1000) - 25 * 60 * 60; // 25 часов назад
    const initData = signInitData(validInitDataParams({ auth_date: String(oldAuthDate) }), BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result).toEqual({ ok: false, reason: "EXPIRED" });
  });

  it("respects a custom maxAgeSeconds", () => {
    const authDate = Math.floor(Date.now() / 1000) - 120;
    const initData = signInitData(validInitDataParams({ auth_date: String(authDate) }), BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN, { maxAgeSeconds: 60 });

    expect(result).toEqual({ ok: false, reason: "EXPIRED" });
  });

  it("rejects initData without a user field", () => {
    const params = validInitDataParams();
    delete (params as Record<string, string | undefined>).user;
    const initData = signInitData(params as Record<string, string>, BOT_TOKEN);

    const result = validateInitData(initData, BOT_TOKEN);

    expect(result).toEqual({ ok: false, reason: "MISSING_USER" });
  });
});
