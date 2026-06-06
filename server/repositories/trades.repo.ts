import { prisma } from "@/lib/prisma";
import type { Prisma, TradeStatus, TradeSourceProvider } from "@prisma/client";

export type TradeCreateInput = {
  externalId:          string;
  leaderWalletId:      string;
  txHash:              string;
  timestamp:           Date;
  soldToken:           string;
  boughtToken:         string;
  soldAmountDecimal:   number;
  boughtAmountDecimal: number;
  usdEstimate?:        number;
  dex?:                string;
  status?:             TradeStatus;
  rawSourceJson:       Record<string, unknown>;
  sourceProvider?:     TradeSourceProvider;
};

type SafeTradeInput = Omit<TradeCreateInput, "rawSourceJson"> & {
  rawSourceJson: Prisma.InputJsonValue;
};

export const tradesRepo = {
  async findByExternalId(externalId: string) {
    return prisma.tradeEvent.findUnique({ where: { externalId } });
  },

  async create(data: TradeCreateInput) {
    const safe = data as unknown as SafeTradeInput;
    return prisma.tradeEvent.create({ data: safe });
  },

  async upsert(data: TradeCreateInput) {
    const safe = data as unknown as SafeTradeInput;
    return prisma.tradeEvent.upsert({
      where:  { externalId: safe.externalId },
      update: safe,
      create: safe,
    });
  },

  async markProcessed(id: string) {
    return prisma.tradeEvent.update({
      where: { id },
      data:  { status: "processed" },
    });
  },

  /**
   * Activity feed: trade events with their decisions and executions.
   * Used by /api/activity.
   */
  async activityFeed(options?: {
    leaderId?: string;
    userId?:   string;
    limit?:    number;
    cursor?:   string;
  }) {
    const { leaderId, userId, limit = 30, cursor } = options ?? {};

    return prisma.tradeEvent.findMany({
      where: {
        ...(leaderId ? { leaderWalletId: leaderId } : {}),
        ...(cursor   ? { id: { lt: cursor } } : {}),
        // When scoped to a user, only surface trades this user actually has a
        // decision on (their copies) — so they never see or try to confirm
        // another user's executions.
        ...(userId   ? { decisions: { some: { userId } } } : {}),
      },
      include: {
        leaderWallet: true,
        decisions: {
          // Show this user's decision per trade when scoped; otherwise latest.
          ...(userId ? { where: { userId } } : {}),
          include: { executions: true },
          orderBy: { createdAt: "desc" },
          take:    1,
        },
      },
      orderBy: { timestamp: "desc" },
      take:    limit,
    });
  },
};
