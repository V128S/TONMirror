/**
 * Integration tests for GET|POST /api/cron/poll-trades
 *
 * Mocks ingestionService so no DB/network is touched. Verifies the CRON_SECRET
 * Bearer auth gate and the async-ack contract: the route returns 202 instantly
 * and runs the (idempotent) poll in the background via after().
 *
 * `after` is mocked to invoke its callback so we can assert the poll is kicked
 * off; in production Vercel keeps the function alive until it settles.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: (cb: () => unknown) => { void cb(); } };
});

vi.mock("@/server/services/ingestion.service", () => ({
  ingestionService: { pollAllLeaders: vi.fn() },
}));

import { GET, POST } from "@/app/api/cron/poll-trades/route";
import { ingestionService } from "@/server/services/ingestion.service";

const SECRET = "test-cron-secret";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/cron/poll-trades", {
    method:  "GET",
    headers,
    // NextRequest accepts a standard Request; cast at call site
  }) as unknown as Parameters<typeof GET>[0];
}

describe("GET|POST /api/cron/poll-trades", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, CRON_SECRET: SECRET, DATABASE_URL: "postgresql://x" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("rejects requests without the correct Bearer secret", async () => {
    const res  = await GET(makeRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
    expect(ingestionService.pollAllLeaders).not.toHaveBeenCalled();
  });

  it("rejects a wrong secret", async () => {
    const res = await GET(makeRequest({ authorization: "Bearer nope" }));
    expect(res.status).toBe(401);
  });

  it("acknowledges with 202 and kicks off the poll in the background", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockResolvedValue({
      leaders: 2, eventsSeen: 5, skipped: 0, decisions: 3, durationMs: 42,
    });

    const res  = await GET(makeRequest({ authorization: `Bearer ${SECRET}` }));
    const json = await res.json();

    expect(res.status).toBe(202);
    expect(json.data).toMatchObject({ accepted: true });
    expect(ingestionService.pollAllLeaders).toHaveBeenCalledOnce();
  });

  it("supports POST for external schedulers", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockResolvedValue({
      leaders: 0, eventsSeen: 0, skipped: 0, decisions: 0, durationMs: 1,
    });

    const res = await POST(makeRequest({ authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(202);
  });

  it("still returns 202 even if the background poll rejects", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockRejectedValue(new Error("boom"));

    const res = await GET(makeRequest({ authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(202);
  });
});
