import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithRetry } from "@/lib/fetch-retry";

const ok  = { status: 200, ok: true,  headers: new Headers() } as Response;
const r429 = { status: 429, ok: false, headers: new Headers() } as Response;

describe("fetchWithRetry", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("returns immediately on a 2xx (no retry)", async () => {
    vi.mocked(fetch).mockResolvedValue(ok);
    const res = await fetchWithRetry("http://x", undefined, { retries: 2, baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 then succeeds", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(r429).mockResolvedValueOnce(ok);
    const res = await fetchWithRetry("http://x", undefined, { retries: 2, baseDelayMs: 1 });
    expect(res.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("retries on network error then throws once attempts are exhausted", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("net"));
    await expect(
      fetchWithRetry("http://x", undefined, { retries: 1, baseDelayMs: 1 }),
    ).rejects.toThrow("net");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
