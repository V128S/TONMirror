/**
 * Omniston module interfaces.
 * All blockchain execution logic is hidden behind these adapters —
 * never instantiate SDK classes directly in business logic.
 */

// ─── Quote ────────────────────────────────────────────────────────────────────

export interface OmnistonQuoteRequest {
  /** Token symbol being sold by the user (e.g. "TON") */
  soldToken: string;
  /** Token symbol being bought by the user (e.g. "USDT") */
  boughtToken: string;
  /** Decimal amount the user plans to spend */
  amountInDecimal: number;
  /** Slippage in basis points (100 = 1%) */
  slippageBps: number;
}

export interface NormalizedQuote {
  quoteId: string;
  soldToken: string;
  boughtToken: string;
  /** Decimal amount of input token */
  amountInDecimal: number;
  /** Decimal estimated output */
  amountOutDecimal: number;
  /** Exchange rate: amountOut / amountIn */
  rate: number;
  slippageBps: number;
  /** Human-readable route summary, e.g. "STON.fi via DeDust" */
  routeSummary: string;
  /** Name of the resolver/liquidity provider */
  resolverName: string;
  /** When the quote expires */
  expiresAt: Date;
  /** Whether this is a live Omniston quote or a demo mock */
  isLive: boolean;
  /** Opaque raw data for building the swap tx — only set for live quotes */
  _raw?: unknown;
}

// ─── Prepare ─────────────────────────────────────────────────────────────────

export interface OmnistonPrepareRequest {
  quoteId: string;
  /** Raw SDK quote object returned by getQuote()._raw — needed by live provider */
  _raw?: unknown;
  /** TON wallet address of the user (needed for live provider) */
  walletAddress?: string;
}

export interface PreparedMessage {
  address: string;   // target contract address
  amount: string;    // nanotons as string
  payload: string;   // hex-encoded BoC
  stateInit?: string;
}

export interface PreparedTransaction {
  messages: PreparedMessage[];
  validUntil: number; // unix seconds
}

// ─── Adapters ─────────────────────────────────────────────────────────────────

export interface QuoteProvider {
  getQuote(request: OmnistonQuoteRequest): Promise<NormalizedQuote>;
}

export interface ExecutionProvider {
  prepareExecution(request: OmnistonPrepareRequest): Promise<PreparedTransaction>;
}
