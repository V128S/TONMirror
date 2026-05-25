/**
 * MockOmnistonProvider — deterministic, always-available provider for demo mode.
 * Returns realistic-looking quotes without any network calls.
 */
import type {
  QuoteProvider,
  ExecutionProvider,
  OmnistonQuoteRequest,
  OmnistonPrepareRequest,
  NormalizedQuote,
  PreparedTransaction,
} from "./types";

// ─── Approximate exchange rates (mock, not real-time) ─────────────────────────

const MOCK_RATES: Record<string, Record<string, number>> = {
  TON:  { USDT: 6.15, STON: 350.0, NOT: 28_400, DOGS: 250_000, TON: 1 },
  USDT: { TON: 0.163, STON: 56.9,  NOT: 4_618,  DOGS: 40_650,  USDT: 1 },
  STON: { TON: 0.00286, USDT: 0.0176, NOT: 81.1, DOGS: 714,    STON: 1 },
  NOT:  { TON: 0.0000352, USDT: 0.000217, STON: 0.0123, DOGS: 8.8, NOT: 1 },
  DOGS: { TON: 0.000004, USDT: 0.0000246, STON: 0.00140, NOT: 0.114, DOGS: 1 },
};

function getRate(sold: string, bought: string): number {
  return MOCK_RATES[sold]?.[bought] ?? 1;
}

export class MockQuoteProvider implements QuoteProvider {
  async getQuote(request: OmnistonQuoteRequest): Promise<NormalizedQuote> {
    // Simulate a small network delay
    await new Promise((r) => setTimeout(r, 300));

    const rate    = getRate(request.soldToken, request.boughtToken);
    const amountOut = request.amountInDecimal * rate;
    const slipAmt   = amountOut * (request.slippageBps / 10_000);

    return {
      quoteId:         `mock_quote_${Date.now()}`,
      soldToken:       request.soldToken,
      boughtToken:     request.boughtToken,
      amountInDecimal: request.amountInDecimal,
      amountOutDecimal: amountOut - slipAmt, // worst-case after slippage
      rate,
      slippageBps:     request.slippageBps,
      routeSummary:    "STON.fi (mock)",
      resolverName:    "STON.fi Aggregator",
      expiresAt:       new Date(Date.now() + 30_000),
      isLive:          false,
    };
  }
}

export class MockExecutionProvider implements ExecutionProvider {
  async prepareExecution(_req: OmnistonPrepareRequest): Promise<PreparedTransaction> {
    await new Promise((r) => setTimeout(r, 200));
    return {
      messages: [
        {
          address:  "EQBv7SOCKPBVKhDBCHjcPLApDFBGKJiBrVb2hRBJYTQCMm4z",
          amount:   "100000000", // 0.1 TON gas
          payload:  "te6ccgEBAQEAAgAAAA==", // stub BoC
        },
      ],
      validUntil: Math.floor(Date.now() / 1000) + 300,
    };
  }
}
