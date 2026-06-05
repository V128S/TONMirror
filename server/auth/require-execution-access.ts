/**
 * Authorization guard for the money-moving execution endpoints
 * (quote / prepare / submit).
 *
 * On the live path every write must come from a verified Telegram user who owns
 * the execution row — otherwise a caller could drive someone else's copy trade.
 * In demo/browser mode (live source off) the guard is open so the app stays
 * fully usable without Telegram, per the demo-first principle.
 */
import { resolveAuthUserId } from "@/server/auth/telegram-auth";
import { executionsRepo } from "@/server/repositories/executions.repo";

export type AccessResult =
  | { ok: true; userId: string | null }
  | { ok: false; status: number; error: string };

export async function requireExecutionAccess(
  req: Request,
  executionId: string,
): Promise<AccessResult> {
  // Demo / browser: no real funds move, keep it open.
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") {
    return { ok: true, userId: null };
  }

  const userId = await resolveAuthUserId(req);
  if (!userId) {
    return { ok: false, status: 401, error: "Authentication required" };
  }

  const execution = await executionsRepo.findById(executionId);
  if (!execution) {
    return { ok: false, status: 404, error: "Execution not found" };
  }
  if (execution.userId !== userId) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId };
}
