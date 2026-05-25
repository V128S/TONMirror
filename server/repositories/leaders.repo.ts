import { prisma } from "@/lib/prisma";
import type { LeaderSourceType, Prisma } from "@prisma/client";

export type LeaderCreateInput = {
  nickname:      string;
  address:       string;
  tags?:         string[];
  riskScore?:    number;
  activityScore?: number;
  winRateApprox?: number;
  notes?:        string;
  sourceType?:   LeaderSourceType;
};

export type LeaderUpdateInput = Partial<Omit<LeaderCreateInput, "address">> & {
  isActive?: boolean;
};

export const leadersRepo = {
  /** List all active leader wallets, optionally enriched with follower count */
  async list(options?: { includeInactive?: boolean }) {
    return prisma.leaderWallet.findMany({
      where: options?.includeInactive ? undefined : { isActive: true },
      orderBy: [{ activityScore: "desc" }, { nickname: "asc" }],
    });
  },

  async findById(id: string) {
    return prisma.leaderWallet.findUnique({ where: { id } });
  },

  async findByAddress(address: string) {
    return prisma.leaderWallet.findUnique({ where: { address } });
  },

  async create(data: LeaderCreateInput) {
    return prisma.leaderWallet.create({ data });
  },

  async update(id: string, data: LeaderUpdateInput) {
    return prisma.leaderWallet.update({ where: { id }, data });
  },

  /** Soft-delete */
  async deactivate(id: string) {
    return prisma.leaderWallet.update({
      where: { id },
      data:  { isActive: false },
    });
  },

  /** Hard delete */
  async delete(id: string) {
    return prisma.leaderWallet.delete({ where: { id } });
  },

  /**
   * Returns leader IDs that the given user is currently following.
   * Follows = has an active (non-paused) FollowStrategy.
   */
  async getFollowedIds(userId: string): Promise<Set<string>> {
    const rows = await prisma.followStrategy.findMany({
      where:  { userId, isPaused: false },
      select: { leaderWalletId: true },
    });
    return new Set(rows.map((r) => r.leaderWalletId));
  },
};
