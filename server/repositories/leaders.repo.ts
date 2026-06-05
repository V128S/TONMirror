import { prisma } from "@/lib/prisma";
import type { LeaderSourceType } from "@prisma/client";

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
   * Upsert a whale discovered by the crawler.
   * If a leader with this address already exists, updates score fields only.
   * If new, creates with sourceType = auto_discovered.
   */
  async upsertFromCrawler(whale: import("@/modules/whale-discovery/types").WhaleScore) {
    return prisma.leaderWallet.upsert({
      where:  { address: whale.address },
      create: {
        address:          whale.address,
        nickname:         whale.nickname,
        tags:             whale.tags,
        riskScore:        Math.round((1 - whale.winRate) * 10),
        activityScore:    whale.activityScore,
        winRateApprox:    whale.winRate,
        sourceType:       "auto_discovered",
        discoveryScore:   whale.score,
        volumeUsd30d:     whale.volumeUsd30d,
        tradeCount30d:    whale.tradeCount30d,
        lastDiscoveredAt: new Date(),
      },
      update: {
        tags:             whale.tags,
        activityScore:    whale.activityScore,
        winRateApprox:    whale.winRate,
        discoveryScore:   whale.score,
        volumeUsd30d:     whale.volumeUsd30d,
        tradeCount30d:    whale.tradeCount30d,
        lastDiscoveredAt: new Date(),
      },
    });
  },

  /** Count auto_discovered leaders added/updated since a given timestamp */
  async countDiscovered(since: Date): Promise<number> {
    return prisma.leaderWallet.count({
      where: {
        sourceType:       "auto_discovered",
        lastDiscoveredAt: { gte: since },
      },
    });
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

  /**
   * Distinct active leaders that at least one user currently follows
   * (has a non-paused FollowStrategy). This is the set the ingestion cron
   * polls — no point fetching trades for leaders nobody mirrors.
   */
  async listFollowedActive(): Promise<{ id: string; address: string; nickname: string }[]> {
    const rows = await prisma.followStrategy.findMany({
      where:    { isPaused: false, leaderWallet: { isActive: true } },
      select:   { leaderWallet: { select: { id: true, address: true, nickname: true } } },
      distinct: ["leaderWalletId"],
    });
    return rows.map((r) => r.leaderWallet);
  },
};
