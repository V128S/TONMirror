import { prisma } from "@/lib/prisma";
import type { StrategyMode } from "@prisma/client";

export type StrategyCreateInput = {
  userId:               string;
  leaderWalletId:       string;
  mode?:                StrategyMode;
  fixedAmount?:         number;
  percentOfLeader?:     number;
  maxTradeSize?:        number;
  slippageBps?:         number;
  allowedTokens?:       string[];
  blockedTokens?:       string[];
  copySells?:           boolean;
  dailyMaxSpend?:       number;
  requireManualConfirm?: boolean;
};

export type StrategyUpdateInput = Partial<
  Omit<StrategyCreateInput, "userId" | "leaderWalletId">
> & {
  isPaused?: boolean;
};

export const strategiesRepo = {
  /** All strategies for a user, with leader wallet info */
  async listByUser(userId: string) {
    return prisma.followStrategy.findMany({
      where:   { userId },
      include: { leaderWallet: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string) {
    return prisma.followStrategy.findUnique({
      where:   { id },
      include: { leaderWallet: true },
    });
  },

  async findByUserAndLeader(userId: string, leaderWalletId: string) {
    return prisma.followStrategy.findUnique({
      where: { userId_leaderWalletId: { userId, leaderWalletId } },
    });
  },

  async create(data: StrategyCreateInput) {
    return prisma.followStrategy.create({ data });
  },

  async update(id: string, data: StrategyUpdateInput) {
    return prisma.followStrategy.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.followStrategy.delete({ where: { id } });
  },

  /**
   * Returns all active (non-paused) strategies for a given leader wallet.
   * Used by the decision pipeline.
   */
  async listActiveForLeader(leaderWalletId: string) {
    return prisma.followStrategy.findMany({
      where:   { leaderWalletId, isPaused: false },
      include: { leaderWallet: true },
    });
  },

  /** Sum of USD executed today for a strategy — used for daily cap check */
  async dailySpendUsd(strategyId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const rows = await prisma.copyDecision.findMany({
      where: {
        strategyId,
        decision:  "accepted",
        createdAt: { gte: startOfDay },
      },
      select: { plannedAmountDecimal: true },
    });
    return rows.reduce((sum, r) => sum + (r.plannedAmountDecimal ?? 0), 0);
  },
};
