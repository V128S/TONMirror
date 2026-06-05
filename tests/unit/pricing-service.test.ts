import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getTonUsd,
  getTokenUsd,
  usdToTokenAmount,
  __resetPricingCacheForTests,
} from "@/server/services/pricing.service";

describe("pricing.service getTonUsd", () => {
  beforeEach(() => __resetPricingCacheForTests());

  it("returns the fallback (3) when live source is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "false");
    expect(await getTonUsd()).toBe(3);
  });

  it("returns the quote-derived rate when live and provider succeeds", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 5.5 }) };
    expect(await getTonUsd({ provider: provider as never })).toBe(5.5);
    expect(provider.getQuote).toHaveBeenCalledOnce();
  });

  it("falls back to 3 when the live provider throws", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockRejectedValue(new Error("ws down")) };
    expect(await getTonUsd({ provider: provider as never })).toBe(3);
  });

  it("caches within the window — second call does not hit the provider", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 4.2 }) };
    await getTonUsd({ provider: provider as never });
    await getTonUsd({ provider: provider as never });
    expect(provider.getQuote).toHaveBeenCalledOnce();
  });
});

describe("pricing.service getTokenUsd", () => {
  beforeEach(() => __resetPricingCacheForTests());

  it("pins USDT to $1 without any provider call, even in demo", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "false");
    const provider = { getQuote: vi.fn() };
    expect(await getTokenUsd("USDT", { provider: provider as never })).toBe(1);
    expect(provider.getQuote).not.toHaveBeenCalled();
  });

  it("prices tsTON via a live tsTON→USDT probe", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 3.4 }) };
    expect(await getTokenUsd("tsTON", { provider: provider as never })).toBe(3.4);
    expect(provider.getQuote).toHaveBeenCalledWith(
      expect.objectContaining({ soldToken: "TSTON", boughtToken: "USDT" }),
    );
  });

  it("caches per token independently", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 5 }) };
    await getTokenUsd("TON", { provider: provider as never });
    await getTokenUsd("TSTON", { provider: provider as never });
    await getTokenUsd("TON", { provider: provider as never }); // cached
    expect(provider.getQuote).toHaveBeenCalledTimes(2); // TON + TSTON, no 3rd
  });
});

describe("pricing.service usdToTokenAmount", () => {
  beforeEach(() => __resetPricingCacheForTests());

  it("is identity for USDT", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    expect(await usdToTokenAmount(25, "USDT")).toBe(25);
  });

  it("divides USD by the token price (a $10 TON copy ≈ 10/price TON)", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 5 }) };
    expect(await usdToTokenAmount(10, "TON", { provider: provider as never })).toBe(2);
  });
});
