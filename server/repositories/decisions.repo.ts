import { prisma } from "@/lib/prisma";
import type { DecisionType } from "@prisma/client";

export type DecisionCreateInput = {
  tradeEventId:         string;
  userId:               string;
  strategyId:           string;
  decision:             DecisionType;
  reason:               string;
  plannedSoldToken:     string;
  plannedBoughtToken:   string;
  plannedAmountDecimal?: number;
  estimatedSlippageBps?: number;
  riskFlags:            string[];
};

export const decisionsRepo = {
  async create(data: DecisionCreateInput) {
    return prisma.copyDecision.create({ data });
  },

  async findById(id: string) {
    return prisma.copyDecision.findUnique({
      where:   { id },
      include: { executions: true },
    });
  },

  /**
   * Idempotency guard for the ingestion loop: returns true when a decision
   * already exists for this (tradeEvent, strategy) pair. Re-polling the same
   * recent window must not create duplicate decisions.
   */
  async existsFor(tradeEventId: string, strategyId: string): Promise<boolean> {
    const found = await prisma.copyDecision.findFirst({
      where:  { tradeEventId, strategyId },
      select: { id: true },
    });
    return found !== null;
  },

  async listByUser(userId: string, limit = 50) {
    return prisma.copyDecision.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    limit,
      include: { tradeEvent: { include: { leaderWallet: true } }, executions: true },
    });
  },
};
