/**
 * ExecutionService — stub for Phase 2.
 *
 * TODO (Phase 3): wire up Omniston SDK to fetch real quotes and
 * build PreparedExecution payloads for TON Connect signing.
 *
 * Right now these methods return placeholder data so the UI
 * can render the full quote card without crashing.
 */
import { executionsRepo } from "@/server/repositories/executions.repo";

export type QuoteInput = {
  executionId: string;
  soldToken:   string;
  boughtToken: string;
  amountIn:    number;
  slippageBps: number;
};

export type PrepareInput = {
  executionId: string;
  quoteId:     string;
};

export const executionService = {
  /**
   * Fetch a quote for an execution.
   * STUB: returns a deterministic fake quote.
   * Phase 3: replace with OmnistonQuoteProvider.getQuote()
   */
  async fetchQuote(input: QuoteInput) {
    // TODO(Phase 3): call OmnistonQuoteProvider
    const fakeOut    = input.amountIn * 6.15; // ~TON price mock
    const fakeQuote = {
      quoteId:      `stub_quote_${Date.now()}`,
      soldToken:    input.soldToken,
      boughtToken:  input.boughtToken,
      amountIn:     input.amountIn,
      estimatedOut: fakeOut,
      slippageBps:  input.slippageBps,
      route:        [{ dex: "ston.fi", poolAddress: "EQ_STUB" }],
      expiresAt:    new Date(Date.now() + 30_000),
    };

    await executionsRepo.update(input.executionId, {
      status:      "quoted",
      quoteId:     fakeQuote.quoteId,
      estimatedOut: fakeQuote.estimatedOut,
      routeJson:   fakeQuote as unknown as Record<string, unknown>,
    });

    return fakeQuote;
  },

  /**
   * Prepare a transaction for signing.
   * STUB: returns a placeholder PreparedExecution.
   * Phase 3: replace with Omniston prepareExecution()
   */
  async prepareExecution(input: PrepareInput) {
    // TODO(Phase 3): call ExecutionProvider.prepareExecution()
    const prepared = {
      executionId: input.executionId,
      quoteId:     input.quoteId,
      messages: [
        {
          address: "EQ_STUB_CONTRACT",
          amount:  "100000000", // 0.1 TON nanotons stub
          payload: "te6ccgEBAQEAAgAAAA==", // empty cell stub
        },
      ],
      validUntil: Math.floor(Date.now() / 1000) + 300,
    };

    await executionsRepo.update(input.executionId, {
      status: "ready",
    });

    return prepared;
  },

  /**
   * Submit a signed transaction.
   * TODO(Phase 3): broadcast via TON Connect / TON API.
   */
  async submitExecution(_executionId: string, _signedBoc: string) {
    // TODO(Phase 3): submit via TON Connect provider
    throw new Error(
      "submitExecution is not yet implemented. " +
      "Phase 3 will wire up TON Connect broadcast.",
    );
  },
};
