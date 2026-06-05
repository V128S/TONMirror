import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import { verifyTelegramInitData } from "@/server/auth/telegram-auth";

const TOKEN = "123456:TEST_BOT_TOKEN";

function buildInitData(
  user: object,
  authDate = Math.floor(Date.now() / 1000),
  token = TOKEN,
): string {
  const params = new URLSearchParams();
  params.set("auth_date", String(authDate));
  params.set("query_id", "AAHtest");
  params.set("user", JSON.stringify(user));
  const dcs = [...params.entries()].map(([k, v]) => `${k}=${v}`).sort().join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(token).digest();
  const hash = crypto.createHmac("sha256", secret).update(dcs).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("verifyTelegramInitData", () => {
  it("accepts a correctly signed payload and returns the user", () => {
    const initData = buildInitData({ id: 555, first_name: "Ann", username: "ann" });
    const user = verifyTelegramInitData(initData, TOKEN);
    expect(user?.id).toBe(555);
    expect(user?.username).toBe("ann");
  });

  it("rejects a tampered hash", () => {
    const initData = buildInitData({ id: 555 }).replace(/hash=[0-9a-f]+/, "hash=deadbeef");
    expect(verifyTelegramInitData(initData, TOKEN)).toBeNull();
  });

  it("rejects a payload signed with a different token", () => {
    const initData = buildInitData({ id: 555 }, undefined, "999:OTHER");
    expect(verifyTelegramInitData(initData, TOKEN)).toBeNull();
  });

  it("rejects a stale auth_date", () => {
    const stale = Math.floor(Date.now() / 1000) - 100_000;
    const initData = buildInitData({ id: 555 }, stale);
    expect(verifyTelegramInitData(initData, TOKEN, 3_600)).toBeNull();
  });

  it("returns null when no bot token is configured", () => {
    const initData = buildInitData({ id: 555 });
    expect(verifyTelegramInitData(initData, undefined)).toBeNull();
  });
});
