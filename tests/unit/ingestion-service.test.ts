/**
 * Unit tests for ingestionService.pollAllLeaders()
 *
 * Mocks the trade source, leadersRepo, decisionService, and prisma (audit log)
 * so no DB or network is touched.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: vi.fn() } },
}));

const getRecentTrades = vi.fn();
vi.mock("@/modules/trade-ingestion", () => ({
  getTradeSource: vi.fn(async () => ({ getRecentTrades })),
}));

vi.mock("@/server/repositories/leaders.repo", () => ({
  leadersRepo: { listFollowedActive: vi.fn() },
}));

vi.mock("@/server/services/decision.service", () => ({
  decisionService: { processTradeEvent: vi.fn() },
}));

import { ingestionService } from "@/server/services/ingestion.service";
import { leadersRepo }      from "@/server/repositories/leaders.repo";
import { decisionService }  from "@/server/services/decision.service";
import { prisma }           from "@/lib/prisma";

const LEADER = { id: "leader_db_id", address: "UQLeaderAddr", nickname: "Alpha" };

function tradeEvent(overrides: Record<string, unknown> = {}) {
  return {
    id:                  "mock_seed_eraddr_0",
    externalId:          "mock_seed_eraddr_0",
    leaderWalletId:      "UQLeaderAddr", // source returns address, not db id
    leaderAddress:       "UQLeaderAddr",
    txHash:              "0xabc",
    timestamp:           new Date(),
    soldToken:           "TON",
    boughtToken:         "USDT",
    soldAmountDecimal:   100,
    boughtAmountDecimal: 615,
    usdEstimate:         615,
    dex:                 "ston.fi",
    sourceProvider:      "mock" as const,
    rawSourceJson:       { mock: true },
    ...overrides,
  };
}

describe("ingestionService.pollAllLeaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns an empty summary when no leaders are followed", async () => {
    vi.mocked(leadersRepo.listFollowedActive).mockResolvedValue([]);

    const result = await ingestionService.pollAllLeaders();

    expect(result.leaders).toBe(0);
    expect(result.eventsSeen).toBe(0);
    expect(result.decisions).toBe(0);
    expect(decisionService.processTradeEvent).not.toHaveBeenCalled();
  });

  it("binds the authoritative DB leader id onto each event", async () => {
    vi.mocked(leadersRepo.listFollowedActive).mockResolvedValue([LEADER]);
    getRecentTrades.mockResolvedValue([tradeEvent()]);
    vi.mocked(decisionService.processTradeEvent).mockResolvedValue(1);

    const result = await ingestionService.pollAllLeaders();

    expect(getRecentTrades).toHaveBeenCalledWith(LEADER.address);
    const passedEvent = vi.mocked(decisionService.processTradeEvent).mock.calls[0][0];
    expect(passedEvent.leaderWalletId).toBe(LEADER.id); // rebound from address → db id
    expect(passedEvent.leaderAddress).toBe(LEADER.address);
    expect(result).toMatchObject({ leaders: 1, eventsSeen: 1, decisions: 1 });
  });

  it("aggregates decisions across multiple leaders and events", async () => {
    vi.mocked(leadersRepo.listFollowedActive).mockResolvedValue([
      LEADER,
      { id: "leader2", address: "UQAddr2", nickname: "Degen" },
    ]);
    getRecentTrades
      .mockResolvedValueOnce([tradeEvent(), tradeEvent({ externalId: "e2" })])
      .mockResolvedValueOnce([tradeEvent({ externalId: "e3" })]);
    vi.mocked(decisionService.processTradeEvent).mockResolvedValue(1);

    const result = await ingestionService.pollAllLeaders();

    expect(result.eventsSeen).toBe(3);
    expect(result.decisions).toBe(3);
  });

  it("re-polling is idempotent: the pipeline reports 0 new decisions", async () => {
    vi.mocked(leadersRepo.listFollowedActive).mockResolvedValue([LEADER]);
    getRecentTrades.mockResolvedValue([tradeEvent()]);
    // Pipeline already has a decision for this (trade, strategy) → returns 0
    vi.mocked(decisionService.processTradeEvent).mockResolvedValue(0);

    const result = await ingestionService.pollAllLeaders();

    expect(result.eventsSeen).toBe(1);
    expect(result.decisions).toBe(0);
  });

  it("never throws: a failing leader is logged and the loop continues", async () => {
    vi.mocked(leadersRepo.listFollowedActive).mockResolvedValue([
      LEADER,
      { id: "leader2", address: "UQAddr2", nickname: "Degen" },
    ]);
    getRecentTrades
      .mockRejectedValueOnce(new Error("TonAPI 500"))
      .mockResolvedValueOnce([tradeEvent({ externalId: "ok" })]);
    vi.mocked(decisionService.processTradeEvent).mockResolvedValue(1);

    const result = await ingestionService.pollAllLeaders();

    expect(prisma.auditLog.create).toHaveBeenCalledOnce();
    expect(result.decisions).toBe(1); // second leader still processed
  });
});
