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
   * Submit a signed transaction.
   *
   * TODO (Phase 4): receive signedBoc / messages from TON Connect, broadcast
   * via TonClient or TON API, update status to submitted/confirmed.
   *
   * Kept as stub because on-chain broadcast without proper error handling and
   * re-entrancy guards is unsafe for an MVP demo.
   */
  async submitExecution(_executionId: string, _signedBoc: string): Promise<never> {
    throw new Error(
      "submitExecution not yet implemented. " +
      "Phase 4: broadcast via TON Connect / TonClient.",
    );
  },
};
