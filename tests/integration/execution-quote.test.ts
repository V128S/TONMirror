/**
 * Integration tests for POST /api/execution/quote
 *
 * Tests the route handler in isolation by mocking executionService.
 * This validates Zod validation, error handling, and happy path shape —
 * without needing a running database.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/execution/quote/route";

// ─── Mock executionService ────────────────────────────────────────────────────

vi.mock("@/server/services/execution.service", () => ({
  executionService: {
    fetchQuote: vi.fn(),
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/execution/quote", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
}

const VALID_BODY = {
  executionId: "claaaaaaaaaaaaaaaaaaaaaa", // valid cuid-ish string
  soldToken:   "TON",
  boughtToken: "USDT",
  amountIn:    10,
  slippageBps: 100,
};

const MOCK_QUOTE = {
  quoteId:         "mock_quote_abc",
  soldToken:       "TON",
  boughtToken:     "USDT",
  amountInDecimal: 10,
  amountOutDecimal: 60.885,
  rate:            6.1,
  slippageBps:     100,
  routeSummary:    "STON.fi (mock)",
  resolverName:    "STON.fi Aggregator",
  expiresAt:       new Date("2026-05-25T19:00:00Z"),
  isLive:          false,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/execution/quote", () => {
  let mockFetchQuote: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { executionService } = await import("@/server/services/execution.service");
    mockFetchQuote = executionService.fetchQuote as ReturnType<typeof vi.fn>;
  });

  // ── Validation ──────────────────────────────────────────────────────────────

  it("returns 422 when body is missing required fields", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("returns 422 when executionId is not a cuid", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, executionId: "not-a-cuid!!!" }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when amountIn is zero or negative", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, amountIn: 0 }));
    expect(res.status).toBe(422);
  });

  it("returns 422 when slippageBps exceeds 10000", async () => {
    const res = await POST(makeRequest({ ...VALID_BODY, slippageBps: 10001 }));
    expect(res.status).toBe(422);
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 200 with quote data on valid request", async () => {
    mockFetchQuote.mockResolvedValueOnce(MOCK_QUOTE);

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toMatchObject({
      quoteId:          "mock_quote_abc",
      soldToken:        "TON",
      boughtToken:      "USDT",
      amountInDecimal:  10,
      rate:             6.1,
      isLive:           false,
    });
  });

  it("applies default slippageBps of 100 when omitted", async () => {
    mockFetchQuote.mockResolvedValueOnce(MOCK_QUOTE);

    const { slippageBps: _, ...bodyWithoutSlippage } = VALID_BODY;
    const res = await POST(makeRequest(bodyWithoutSlippage));
    expect(res.status).toBe(200);

    expect(mockFetchQuote).toHaveBeenCalledWith(
      expect.objectContaining({ slippageBps: 100 }),
    );
  });

  it("forwards soldToken and boughtToken from request body to service", async () => {
    mockFetchQuote.mockResolvedValueOnce({ ...MOCK_QUOTE, soldToken: "TON", boughtToken: "STON" });

    const res = await POST(makeRequest({ ...VALID_BODY, soldToken: "TON", boughtToken: "STON" }));
    expect(res.status).toBe(200);

    expect(mockFetchQuote).toHaveBeenCalledWith(
      expect.objectContaining({ soldToken: "TON", boughtToken: "STON" }),
    );
  });

  // ── Error path ──────────────────────────────────────────────────────────────

  it("returns 500 when executionService throws", async () => {
    mockFetchQuote.mockRejectedValueOnce(new Error("Execution not found"));

    const res = await POST(makeRequest(VALID_BODY));
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Failed to fetch quote");
  });
});
