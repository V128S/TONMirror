/**
 * Unit tests for confirmationService.sweepPending()
 *
 * Mocks executionsRepo, prisma (audit log), env, and global fetch (TonAPI).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: vi.fn() } },
}));

vi.mock("@/server/repositories/executions.repo", () => ({
  executionsRepo: { listAwaitingConfirmation: vi.fn(), update: vi.fn() },
}));

import { confirmationService } from "@/server/services/confirmation.service";
import { executionsRepo }      from "@/server/repositories/executions.repo";

const REAL_HASH = "a".repeat(64); // looks like a 64-hex message hash
const DEMO_REF  = "te6cckEBAQEAAgAAAEysuc0=";

function exec(id: string, txHash: string | null) {
  return { id, txHash, status: "submitted" } as never;
}

describe("confirmationService.sweepPending", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, DATABASE_URL: "postgresql://x" };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("skips demo/non-hash references without calling TonAPI", async () => {
    vi.mocked(executionsRepo.listAwaitingConfirmation).mockResolvedValue([exec("e1", DEMO_REF)]);

    const result = await confirmationService.sweepPending();

    expect(fetch).not.toHaveBeenCalled();
    expect(executionsRepo.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ checked: 1, confirmed: 0, failed: 0 });
  });

  it("confirms an execution when TonAPI returns a successful tx", async () => {
    vi.mocked(executionsRepo.listAwaitingConfirmation).mockResolvedValue([exec("e1", REAL_HASH)]);
    vi.mocked(fetch).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ hash: "canonicaltxhash", success: true }),
    } as Response);

    const result = await confirmationService.sweepPending();

    expect(executionsRepo.update).toHaveBeenCalledWith("e1", {
      status: "confirmed", txHash: "canonicaltxhash",
    });
    expect(result.confirmed).toBe(1);
  });

  it("marks failed when TonAPI returns an aborted tx", async () => {
    vi.mocked(executionsRepo.listAwaitingConfirmation).mockResolvedValue([exec("e1", REAL_HASH)]);
    vi.mocked(fetch).mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ hash: "h", success: false }),
    } as Response);

    const result = await confirmationService.sweepPending();

    expect(executionsRepo.update).toHaveBeenCalledWith("e1", expect.objectContaining({ status: "failed" }));
    expect(result.failed).toBe(1);
  });

  it("leaves the row submitted when the tx is not indexed yet (404)", async () => {
    vi.mocked(executionsRepo.listAwaitingConfirmation).mockResolvedValue([exec("e1", REAL_HASH)]);
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);

    const result = await confirmationService.sweepPending();

    expect(executionsRepo.update).not.toHaveBeenCalled();
    expect(result).toMatchObject({ checked: 1, confirmed: 0, failed: 0 });
  });

  it("never throws when TonAPI fetch rejects", async () => {
    vi.mocked(executionsRepo.listAwaitingConfirmation).mockResolvedValue([exec("e1", REAL_HASH)]);
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    const result = await confirmationService.sweepPending();
    expect(result).toMatchObject({ checked: 1, confirmed: 0, failed: 0 });
  });
});
