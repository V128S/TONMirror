import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTonUsd, __resetPricingCacheForTests } from "@/server/services/pricing.service";

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
