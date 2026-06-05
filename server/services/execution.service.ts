/**
 * ExecutionService — orchestrates quote fetching and tx preparation.
 *
 * Phase 3: wires up Omniston module (real or mock, gated by env flag).
 * Phase 4 TODO: wire `submitExecution` to TON Connect broadcast.
 */
import { executionsRepo } from "@/server/repositories/executions.repo";
import { getQuoteProvider, getExecutionProvider } from "@/modules/omniston";

export type QuoteInput = {
  executionId: string;
  soldToken:   string;
  boughtToken: string;
  amountIn:    number;
  slippageBps: number;
};

export type PrepareInput = {
  executionId:    string;
  quoteId:        string;
  /** Connected wallet address — required for live provider */
  walletAddress?: string;
};

export const executionService = {
  /**
   * Fetch a quote via Omniston (real or mock).
   * Saves quote data to the CopyExecution row.
   */
  async fetchQuote(input: QuoteInput) {
    const provider = await getQuoteProvider();

    const quote = await provider.getQuote({
      soldToken:       input.soldToken,
      boughtToken:     input.boughtToken,
      amountInDecimal: input.amountIn,
      slippageBps:     input.slippageBps,
    });

    await executionsRepo.update(input.executionId, {
      status:       "quoted",
      quoteId:      quote.quoteId,
      estimatedOut: quote.amountOutDecimal,
      routeJson:    {
        quoteId:         quote.quoteId,
        soldToken:       quote.soldToken,
        boughtToken:     quote.boughtToken,
        amountInDecimal: quote.amountInDecimal,
        amountOutDecimal: quote.amountOutDecimal,
        rate:            quote.rate,
        slippageBps:     quote.slippageBps,
        routeSummary:    quote.routeSummary,
        resolverName:    quote.resolverName,
        expiresAt:       quote.expiresAt.toISOString(),
        isLive:          quote.isLive,
        // Persist raw quote for live prepare step (opaque to UI)
        _raw:            quote._raw ?? null,
      },
    });

    return quote;
  },

  /**
   * Build a prepared transaction from an existing quote.
   * Returns messages ready for TON Connect signing.
   */
  async prepareExecution(input: PrepareInput) {
    const execution = await executionsRepo.findById(input.executionId);
    if (!execution) throw new Error("Execution not found");

    // Recover raw quote from stored routeJson if live
    const stored  = execution.routeJson as Record<string, unknown> | null;
    const rawQuote = stored?._raw ?? undefined;

    const provider = await getExecutionProvider();

    const prepared = await provider.prepareExecution({
      quoteId:       input.quoteId,
      _raw:          rawQuote,
      walletAddress: input.walletAddress,
    });

    await executionsRepo.update(input.executionId, {
      status: "ready",
    });

    return prepared;
  },

  /**
   * Mark an execution as submitted after the user has signed and sent the tx
   * via TON Connect.
   *
   * TON Connect broadcasts the transaction itself via the connected wallet app
   * (Tonkeeper, MyTonWallet, etc.) — we only need to record that it was sent.
   *
   * The signed BoC is stored as a txHash reference. In production you would
   * poll TonAPI GET /v2/blockchain/transactions to get the canonical on-chain
   * hash after the tx lands (usually within a few seconds on TON).
   *
   * TODO (production): after storing "submitted", start a background job that
   * polls TonAPI every 3s for up to 60s to confirm the tx and update status
   * to "confirmed" with the real txHash.
   */
  async submitExecution(
    executionId: string,
    signedBoc: string,
  ): Promise<{ id: string; status: string; txHash: string | null }> {
    const execution = await executionsRepo.findById(executionId);
    if (!execution) throw new Error("Execution not found");

    if (execution.status === "submitted" || execution.status === "confirmed") {
      // Idempotent — already submitted, return current state
      return { id: execution.id, status: execution.status, txHash: execution.txHash };
    }

    // Resolve the external-message hash from the signed BoC so the confirmation
    // sweep can look the tx up on TonAPI. Falls back to a BoC prefix (demo / parse
    // failure) — the sweep treats non-hash values as "skip", never failing them.
    const msgHash = await extractMessageHash(signedBoc);
    const txHash  = msgHash ?? signedBoc.slice(0, 64);

    const updated = await executionsRepo.update(executionId, {
      status: "submitted",
      txHash,
    });

    return {
      id:     updated.id,
      status: updated.status,
      txHash: updated.txHash,
    };
  },
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Computes the hash (hex) of a signed external-message BoC returned by
 * TON Connect `sendTransaction()`. This hash is what TonAPI indexes, so the
 * confirmation sweep can resolve the on-chain transaction from it.
 *
 * Returns null on any parse error (e.g. demo/mock BoCs) so the caller can fall
 * back to a non-hash reference that the sweep will skip.
 */
async function extractMessageHash(signedBoc: string): Promise<string | null> {
  try {
    const { Cell } = await import("@ton/core");
    const cell = Cell.fromBase64(signedBoc);
    return cell.hash().toString("hex");
  } catch {
    return null;
  }
}
