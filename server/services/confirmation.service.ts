/**
 * ConfirmationService — advances submitted executions to their final on-chain state.
 *
 * Serverless-safe: a cron route (`/api/cron/confirm-executions`) calls
 * `sweepPending()` on a schedule instead of a long-lived poll after submit.
 *
 * For each `submitted` execution whose `txHash` is a real external-message hash,
 * we ask TonAPI for the transaction:
 *   - found + success → `confirmed` (canonical tx hash stored)
 *   - found + aborted → `failed`
 *   - not indexed yet → left `submitted` (next sweep retries)
 *
 * Conservative by design: demo/mock executions store a non-hash BoC prefix and
 * are skipped — never marked failed.
 *
 * NEVER throws — per-row try/catch + AuditLog on error.
 */
import { prisma } from "@/lib/prisma";
import { executionsRepo } from "@/server/repositories/executions.repo";
import { getServerEnv }   from "@/lib/env";

export type ConfirmResult = {
  checked:    number;
  confirmed:  number;
  failed:     number;
  durationMs: number;
};

const HEX64 = /^[0-9a-f]{64}$/i;

export const confirmationService = {
  async sweepPending(opts?: { limit?: number }): Promise<ConfirmResult> {
    const start  = Date.now();
    const apiKey = getServerEnv().TON_API_KEY;

    const rows = await executionsRepo.listAwaitingConfirmation({ limit: opts?.limit ?? 50 });

    let checked = 0;
    let confirmed = 0;
    let failed = 0;

    for (const ex of rows) {
      checked += 1;

      // Skip demo / unparseable references — only real message hashes are resolvable.
      if (!ex.txHash || !HEX64.test(ex.txHash)) continue;

      try {
        const tx = await fetchTransactionByMessageHash(ex.txHash, apiKey);
        if (!tx) continue; // not indexed yet → retry next sweep

        if (tx.success) {
          await executionsRepo.update(ex.id, { status: "confirmed", txHash: tx.hash });
          confirmed += 1;
        } else {
          await executionsRepo.update(ex.id, {
            status:        "failed",
            failureReason: "Transaction aborted on-chain",
          });
          failed += 1;
        }
      } catch (err) {
        await writeErrorLog("confirm_execution", ex.id, err);
      }
    }

    // Time out executions stuck in `submitted` long past the active window so
    // they don't linger forever. Only real on-chain-hash rows are failed; demo /
    // mock BoCs (non-hex txHash) are left untouched, never failed.
    const STALE_AFTER_MS = 30 * 60_000;
    const stale = await executionsRepo.listStaleSubmitted({
      olderThanMs: STALE_AFTER_MS,
      limit:       opts?.limit ?? 50,
    });
    for (const ex of stale) {
      if (!ex.txHash || !HEX64.test(ex.txHash)) continue;
      try {
        await executionsRepo.update(ex.id, {
          status:        "failed",
          failureReason: "Confirmation timed out",
        });
        failed += 1;
      } catch (err) {
        await writeErrorLog("timeout_execution", ex.id, err);
      }
    }

    return { checked, confirmed, failed, durationMs: Date.now() - start };
  },
};

// ─── TonAPI ───────────────────────────────────────────────────────────────────

type ResolvedTx = { hash: string; success: boolean };

/**
 * GET /v2/blockchain/messages/{msg_hash}/transaction → the transaction that
 * processed this external message. Returns null when not yet indexed or on any
 * network/parse error (so the caller retries on the next sweep).
 */
async function fetchTransactionByMessageHash(
  msgHash: string,
  apiKey?: string,
): Promise<ResolvedTx | null> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const url = `https://tonapi.io/v2/blockchain/messages/${msgHash}/transaction`;

  let res: Response;
  try {
    res = await fetch(url, { headers });
  } catch {
    return null;
  }

  if (res.status === 404) return null; // not indexed yet
  if (!res.ok) return null;

  try {
    const json = (await res.json()) as { hash?: string; success?: boolean };
    if (typeof json.hash !== "string") return null;
    return { hash: json.hash, success: json.success !== false };
  } catch {
    return null;
  }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function writeErrorLog(action: string, entityId: string, err: unknown) {
  try {
    await prisma.auditLog.create({
      data: {
        entityType:  "confirmation_sweep",
        entityId,
        action:      `error:${action}`,
        payloadJson: { message: String(err) },
      },
    });
  } catch {
    console.error("[ConfirmationService] audit log write failed:", err);
  }
}
