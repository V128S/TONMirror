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
};
