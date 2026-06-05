/**
 * Unit tests for requireExecutionAccess() — the live-path ownership guard on the
 * execution write endpoints.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { resolveAuthUserId, findById } = vi.hoisted(() => ({
  resolveAuthUserId: vi.fn(),
  findById: vi.fn(),
}));
vi.mock("@/server/auth/telegram-auth", () => ({ resolveAuthUserId }));
vi.mock("@/server/repositories/executions.repo", () => ({
  executionsRepo: { findById },
}));

import { requireExecutionAccess } from "@/server/auth/require-execution-access";

const req = new Request("http://localhost/api/execution/prepare", { method: "POST" });

describe("requireExecutionAccess", () => {
  const originalEnv = process.env;
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });
  afterEach(() => { process.env = originalEnv; });

  it("is open in demo (live source off) without touching auth", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "false";
    const res = await requireExecutionAccess(req, "e1");
    expect(res).toEqual({ ok: true, userId: null });
    expect(resolveAuthUserId).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated callers on the live path with 401", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "true";
    resolveAuthUserId.mockResolvedValue(null);
    expect(await requireExecutionAccess(req, "e1")).toMatchObject({ ok: false, status: 401 });
  });

  it("returns 404 when the execution doesn't exist", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "true";
    resolveAuthUserId.mockResolvedValue("user_1");
    findById.mockResolvedValue(null);
    expect(await requireExecutionAccess(req, "e1")).toMatchObject({ ok: false, status: 404 });
  });

  it("returns 403 when the caller doesn't own the execution", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "true";
    resolveAuthUserId.mockResolvedValue("user_1");
    findById.mockResolvedValue({ id: "e1", userId: "user_2" });
    expect(await requireExecutionAccess(req, "e1")).toMatchObject({ ok: false, status: 403 });
  });

  it("allows the owner on the live path", async () => {
    process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE = "true";
    resolveAuthUserId.mockResolvedValue("user_1");
    findById.mockResolvedValue({ id: "e1", userId: "user_1" });
    expect(await requireExecutionAccess(req, "e1")).toEqual({ ok: true, userId: "user_1" });
  });
});
