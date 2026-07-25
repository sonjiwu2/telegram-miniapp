import { describe, expect, it } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("session tokens", () => {
  it("round-trips a valid token", () => {
    const token = createSessionToken("user-123");

    const payload = verifySessionToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe("user-123");
  });

  it("rejects a tampered payload", () => {
    const token = createSessionToken("user-123");
    const [payload, signature] = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ userId: "attacker", iat: 0, exp: 9999999999 }),
    ).toString("base64url");

    expect(verifySessionToken(`${tamperedPayload}.${signature}`)).toBeNull();
    void payload;
  });

  it("rejects a tampered signature", () => {
    const token = createSessionToken("user-123");
    const [payload] = token.split(".");

    expect(verifySessionToken(`${payload}.not-a-valid-signature`)).toBeNull();
  });

  it("rejects an expired token", () => {
    const now = Math.floor(Date.now() / 1000);
    const token = createSessionToken("user-123", now - 60 * 60 * 24 * 31); // выдан 31 день назад

    expect(verifySessionToken(token, now)).toBeNull();
  });

  it("rejects a malformed token", () => {
    expect(verifySessionToken("not-a-token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
  });
});
