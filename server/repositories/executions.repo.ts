import { prisma } from "@/lib/prisma";
import type { Prisma, ExecutionStatus } from "@prisma/client";

export type ExecutionCreateInput = {
  decisionId:    string;
  userId:        string;
  status:        ExecutionStatus;
  quoteId?:      string;
  routeJson?:    Record<string, unknown>;
  estimatedOut?: number;
};

export type ExecutionUpdateInput = Partial<{
  status:        ExecutionStatus;
  quoteId:       string;
  routeJson:     Record<string, unknown>;
  estimatedOut:  number;
  txHash:        string;
  failureReason: string;
}>;

// Cast helpers for Prisma's Json type
type SafeCreateInput = Omit<ExecutionCreateInput, "routeJson"> & {
  routeJson?: Prisma.InputJsonValue;
};
type SafeUpdateInput = Omit<ExecutionUpdateInput, "routeJson"> & {
  routeJson?: Prisma.InputJsonValue;
};

export const executionsRepo = {
  async create(data: ExecutionCreateInput) {
    return prisma.copyExecution.create({ data: data as unknown as SafeCreateInput });
  },

  async update(id: string, data: ExecutionUpdateInput) {
    return prisma.copyExecution.update({
      where: { id },
      data:  data as unknown as SafeUpdateInput,
    });
  },

  async findById(id: string) {
    return prisma.copyExecution.findUnique({
      where:   { id },
      include: { decision: true },
    });
  },

  async listByUser(userId: string, limit = 50) {
    return prisma.copyExecution.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    limit,
      include: { decision: { include: { tradeEvent: true } } },
    });
  },

  /**
   * Executions awaiting on-chain confirmation: status `submitted`, settled at
   * least `minAgeMs` ago (give the wallet time to broadcast) and no older than
   * `maxAgeMs` (stop chasing stale rows). Used by the confirmation cron sweep.
   */
  async listAwaitingConfirmation(opts?: {
    minAgeMs?: number;
    maxAgeMs?: number;
    limit?:    number;
  }) {
    const now   = Date.now();
    const upper = new Date(now - (opts?.minAgeMs ?? 5_000));        // updated ≥ 5s ago
    const lower = new Date(now - (opts?.maxAgeMs ?? 10 * 60_000));  // updated ≤ 10min ago
    return prisma.copyExecution.findMany({
      where:   { status: "submitted", updatedAt: { lte: upper, gte: lower } },
      orderBy: { updatedAt: "asc" },
      take:    opts?.limit ?? 50,
    });
  },
};
