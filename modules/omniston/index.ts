/**
 * Omniston provider factory.
 *
 * Returns mock providers in demo mode, live providers when NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 * Import this file in server code only — never in client components.
 */
import { MockQuoteProvider, MockExecutionProvider } from "./mock-provider";
import type { QuoteProvider, ExecutionProvider } from "./types";

// Lazy load real providers so they don't bundle into demo mode
async function getLiveProviders(): Promise<{
  quote:     QuoteProvider;
  execution: ExecutionProvider;
}> {
  const { OmnistonQuoteProvider, OmnistonExecutionProvider } =
    await import("./omniston-provider");
  return {
    quote:     new OmnistonQuoteProvider(),
    execution: new OmnistonExecutionProvider(),
  };
}

/** Returns appropriate QuoteProvider based on env flag */
export async function getQuoteProvider(): Promise<QuoteProvider> {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true") {
    const { quote } = await getLiveProviders();
    return quote;
  }
  return new MockQuoteProvider();
}

/** Returns appropriate ExecutionProvider based on env flag */
export async function getExecutionProvider(): Promise<ExecutionProvider> {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true") {
    const { execution } = await getLiveProviders();
    return execution;
  }
  return new MockExecutionProvider();
}

// Re-export types for consumers
export type { QuoteProvider, ExecutionProvider, NormalizedQuote, PreparedTransaction } from "./types";
