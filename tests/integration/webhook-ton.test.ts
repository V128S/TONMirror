/**
 * Integration tests for POST /api/webhooks/ton
 *
 * Mocks:
 *   - NEXT_PUBLIC_ENABLE_LIVE_SOURCE env flag
 *   - TON_WEBHOOK_SECRET env
 *   - leadersRepo (no DB)
 *   - decisionService (no DB)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock("@/server/repositories/leaders.repo", () => ({
  leadersRepo: { findByAddress: vi.fn() },
}));

vi.mock("@/server/services/decision.service", () => ({
  decisionService: { processTradeEvent: vi.fn() },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_SECRET   = "test-secret-123";
const LEADER_DB_ID   = "claaaaaaaaaaaaaaaaaaaaaa";
const LEADER_ADDRESS = "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL";

const VALID_SWAP_PAYLOAD = {
  event_id:  "evt_test_001",
  timestamp: 1716670000,
  account:   { address: LEADER_ADDRESS },
  actions: [
    {
      type:   "JettonSwap",
      status: "ok",
      jetton_swap: {
        dex:               "stonfi",
        amount_in:         "10000000000",
        amount_out:        "61500000",
        ton_in:            "10000000000",
        ton_out:           null,
        user_wallet:       LEADER_ADDRESS,
        jetton_master_in:  null,
        jetton_master_out: "EQBynBO23ywHy_CgarY9NK9FTz0yDsG82PtcbSTQgGoXwiuA",
      },
    },
  ],
};

function makeRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/webhooks/ton", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/ton", () => {
  // Set up env & clear mocks before each test
  const originalEnv = process.env;

  beforeEach(async () => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_ENABLE_LIVE_SOURCE: "true",
      TON_WEBHOOK_SECRET: VALID_SECRET,
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ── Gate ────────────────────────────────────────────────────────────────────

  it("returns 403 when live source is disabled", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "false";
    // Re-import after env change
    const { POST } = await import("@/app/api/webhooks/ton/route");
    const res = await POST(makeRequest(VALID_SWAP_PAYLOAD, { "x-webhook-secret": VALID_SECRET }));
    expect(res.status).toBe(403);
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  it("returns 401 when secret header is missing", async () => {
    const { POST } = await import("@/app/api/webhooks/ton/route");
    const res = await POST(makeRequest(VALID_SWAP_PAYLOAD));
    expect(res.status).toBe(401);
  });

  it("returns 401 when secret is wrong", async () => {
    const { POST } = await import("@/app/api/webhooks/ton/route");
    const res = await POST(makeRequest(VALID_SWAP_PAYLOAD, { "x-webhook-secret": "wrong!" }));
    expect(res.status).toBe(401);
  });

  // ── Unknown wallet ──────────────────────────────────────────────────────────

  it("returns 200 with processed:false for unknown wallet", async () => {
    const { leadersRepo } = await import("@/server/repositories/leaders.repo");
    (leadersRepo.findByAddress as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const { POST } = await import("@/app/api/webhooks/ton/route");
    const res = await POST(
      makeRequest(VALID_SWAP_PAYLOAD, { "x-webhook-secret": VALID_SECRET }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.processed).toBe(false);
    expect(json.data.reason).toBe("unknown_wallet");
  });

  // ── Happy path ──────────────────────────────────────────────────────────────

  it("returns 200 with processed:true for a valid swap from a tracked wallet", async () => {
    const { leadersRepo } = await import("@/server/repositories/leaders.repo");
    const { decisionService } = await import("@/server/services/decision.service");

    (leadersRepo.findByAddress as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: LEADER_DB_ID, address: LEADER_ADDRESS,
    });
    (decisionService.processTradeEvent as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/webhooks/ton/route");
    const res = await POST(
      makeRequest(VALID_SWAP_PAYLOAD, { "x-webhook-secret": VALID_SECRET }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.ok).toBe(true);
    expect(json.data.processed).toBe(true);

    expect(decisionService.processTradeEvent).toHaveBeenCalledOnce();
  });
});
