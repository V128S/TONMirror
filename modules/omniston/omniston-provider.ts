/**
 * OmnistonQuoteProvider — real Omniston SDK adapter.
 *
 * Only instantiated when NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true.
 * Creates a short-lived WebSocket connection per request (serverless-safe).
 *
 * Uses the STON.fi Omniston API: wss://omni-ws.ston.fi
 */
import { Omniston, WebSocketTransport } from "@ston-fi/omniston-sdk";
import type { Quote } from "@ston-fi/omniston-sdk";
import type {
  QuoteProvider,
  ExecutionProvider,
  OmnistonQuoteRequest,
  OmnistonPrepareRequest,
  NormalizedQuote,
  PreparedTransaction,
} from "./types";
import {
  getTokenInfo,
  toBaseUnits,
  fromBaseUnits,
  bpsToOmnistonPips,
} from "./token-map";

const OMNISTON_WS_URL = "wss://omni-ws.ston.fi";
const QUOTE_TIMEOUT_MS = 8_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Creates a short-lived Omniston client and waits for the first quote.
 * Unsubscribes and closes the transport after receiving a result.
 */
async function fetchFirstQuote(
  request: Parameters<Omniston["requestForQuote"]>[0],
): Promise<Quote> {
  const transport = new WebSocketTransport(OMNISTON_WS_URL);
  const client    = new Omniston({ apiUrl: OMNISTON_WS_URL, transport });

  return new Promise((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      sub.unsubscribe();
      try { (transport as { close?: () => void }).close?.(); } catch {}
      reject(new Error("Omniston quote timed out after 8s"));
    }, QUOTE_TIMEOUT_MS);

    const sub = client.requestForQuote(request).subscribe({
      next: (event) => {
        if (settled) return;
        if ("$case" in event) {
          if (event.$case === "quoteUpdated") {
            settled = true;
            clearTimeout(timer);
            sub.unsubscribe();
            try { (transport as { close?: () => void }).close?.(); } catch {}
            resolve(event.value);
          } else if (event.$case === "noQuote") {
            settled = true;
            clearTimeout(timer);
            sub.unsubscribe();
            try { (transport as { close?: () => void }).close?.(); } catch {}
            reject(new Error("Omniston: no quote available for this token pair"));
          }
        }
      },
      error: (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { (transport as { close?: () => void }).close?.(); } catch {}
        reject(err);
      },
    });
  });
}

// ─── QuoteProvider ────────────────────────────────────────────────────────────

export class OmnistonQuoteProvider implements QuoteProvider {
  async getQuote(request: OmnistonQuoteRequest): Promise<NormalizedQuote> {
    const soldInfo   = getTokenInfo(request.soldToken);
    const boughtInfo = getTokenInfo(request.boughtToken);

    if (!soldInfo || !boughtInfo) {
      throw new Error(
        `Unknown token: ${!soldInfo ? request.soldToken : request.boughtToken}`,
      );
    }

    const inputUnits = toBaseUnits(request.amountInDecimal, soldInfo.decimals);

    const rfqRequest = {
      inputAsset:  soldInfo.assetId,
      outputAsset: boughtInfo.assetId,
      amount:      { $case: "inputUnits" as const, value: inputUnits },
      settlementParams: [
        {
          params: {
            $case: "swap" as const,
            value: {
              maxPriceSlippagePips: bpsToOmnistonPips(request.slippageBps),
            },
          },
        },
      ],
    };

    const quote = await fetchFirstQuote(rfqRequest);

    const amountOutDecimal = fromBaseUnits(
      quote.outputUnits,
      boughtInfo.decimals,
    );
    const amountInDecimal = fromBaseUnits(
      quote.inputUnits,
      soldInfo.decimals,
    );
    const rate = amountInDecimal > 0 ? amountOutDecimal / amountInDecimal : 0;

    // Extract route summary from settlementData
    let routeSummary = "Omniston";
    let resolverName = quote.resolverName ?? "STON.fi";
    if ("settlementData" in quote && quote.settlementData.$case === "swap") {
      const routes = quote.settlementData.value.routes ?? [];
      const steps  = routes.flatMap((r: { steps?: unknown[] }) => r.steps ?? []);
      routeSummary = steps.length > 0
        ? `${steps.length} hop${steps.length > 1 ? "s" : ""} via STON.fi`
        : "Direct via STON.fi";
    }

    return {
      quoteId:          quote.quoteId,
      soldToken:        request.soldToken,
      boughtToken:      request.boughtToken,
      amountInDecimal,
      amountOutDecimal,
      rate,
      slippageBps:      request.slippageBps,
      routeSummary,
      resolverName,
      expiresAt:        new Date(Date.now() + 30_000), // 30s validity
      isLive:           true,
      _raw:             quote,
    };
  }
}

// ─── ExecutionProvider ────────────────────────────────────────────────────────

export class OmnistonExecutionProvider implements ExecutionProvider {
  async prepareExecution(request: OmnistonPrepareRequest): Promise<PreparedTransaction> {
    if (!request.walletAddress) {
      throw new Error("walletAddress is required for live execution preparation");
    }
    if (!request._raw) {
      throw new Error("rawQuote is required for live execution preparation");
    }

    const transport = new WebSocketTransport(OMNISTON_WS_URL);
    const client    = new Omniston({ apiUrl: OMNISTON_WS_URL, transport });

    try {
      const tx = await client.tonBuildSwap({
        quoteId:             request.quoteId,
        transferSrcAddress:  { chain: { $case: "ton", value: request.walletAddress } },
        useRecommendedSlippage: false,
      });

      return {
        messages:   tx.messages.map((msg) => ({
          address:   msg.targetAddress,
          amount:    msg.sendAmount,
          payload:   msg.payload,
          stateInit: msg.jettonWalletStateInit,
        })),
        validUntil: Math.floor(Date.now() / 1000) + 300,
      };
    } finally {
      try { (transport as { close?: () => void }).close?.(); } catch {}
    }
  }
}
