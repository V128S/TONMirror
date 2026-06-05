/**
 * Integration tests for GET|POST /api/cron/poll-trades
 *
 * Mocks ingestionService so no DB/network is touched. Verifies the
 * CRON_SECRET Bearer auth gate and the summary passthrough.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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

  it("runs the poll and returns the summary with a valid secret", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockResolvedValue({
      leaders: 2, eventsSeen: 5, decisions: 3, durationMs: 42,
    });

    const res  = await GET(makeRequest({ authorization: `Bearer ${SECRET}` }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toMatchObject({ leaders: 2, eventsSeen: 5, decisions: 3 });
    expect(ingestionService.pollAllLeaders).toHaveBeenCalledOnce();
  });

  it("supports POST for external schedulers", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockResolvedValue({
      leaders: 0, eventsSeen: 0, decisions: 0, durationMs: 1,
    });

    const res = await POST(makeRequest({ authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
  });

  it("returns 500 when ingestion throws", async () => {
    vi.mocked(ingestionService.pollAllLeaders).mockRejectedValue(new Error("boom"));

    const res  = await GET(makeRequest({ authorization: `Bearer ${SECRET}` }));
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Ingestion failed");
  });
});
