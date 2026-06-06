"use client";

import { useState, useEffect } from "react";
import { Glass } from "@/components/glass/Glass";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatAmount, formatBps } from "@/lib/format";
import { useQuoteFlow, type QuoteFlowParams } from "./useQuoteFlow";
import type { NormalizedQuote } from "@/modules/omniston/types";

interface GlassQuoteCardProps extends QuoteFlowParams {
  onDismiss: () => void;
}

function useCountdown(expiresAt: Date | null): number {
  const [secsLeft, setSecsLeft] = useState(0);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () =>
      setSecsLeft(Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return secsLeft;
}

const primaryBtn: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em",
  background: "rgb(var(--text1))", color: "rgb(var(--bg))",
  boxShadow: "0 8px 22px -6px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.15) inset",
};

function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="w-full rounded-[18px] py-3.5 text-center disabled:opacity-50"
      style={primaryBtn}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full rounded-[18px] py-3 text-center"
      style={{ fontSize: 14, fontWeight: 600, color: "rgb(var(--text1))", background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
      {children}
    </button>
  );
}

function MetaRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-subtle" style={{ fontSize: 12 }}>{k}</span>
      <span className="text-fg" style={{ fontSize: 12, fontWeight: 500 }}>{v}</span>
    </div>
  );
}

function QuoteDetails({
  quote, onConfirm, onRefresh, isPreparing, isExpired,
}: {
  quote: NormalizedQuote; onConfirm: () => void; onRefresh: () => void;
  isPreparing: boolean; isExpired: boolean;
}) {
  const expiresAt =
    typeof quote.expiresAt === "string" ? new Date(quote.expiresAt) : quote.expiresAt;
  const secsLeft = useCountdown(isExpired ? null : expiresAt);

  return (
    <div className="space-y-3">
      {/* Swap */}
      <Glass radius={20} padding={16}>
        <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 8 }}>
          <div>
            <div className="text-subtle" style={{ fontSize: 11, marginBottom: 2 }}>You sell</div>
            <div className="text-fg gl-tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {formatAmount(quote.amountInDecimal)}
            </div>
            <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>{quote.soldToken}</div>
          </div>
          <svg width="28" height="16" viewBox="0 0 28 16" fill="none">
            <path d="M2 8h22" stroke="rgb(var(--text3))" strokeWidth="1.2" strokeDasharray="2 3" />
            <path d="M20 3l5 5-5 5" stroke="rgb(var(--text1))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <div className="text-right">
            <div className="text-subtle" style={{ fontSize: 11, marginBottom: 2 }}>Receive</div>
            <div className="text-fg gl-tnum" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {formatAmount(quote.amountOutDecimal)}
            </div>
            <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>{quote.boughtToken}</div>
          </div>
        </div>
      </Glass>

      {/* Meta */}
      <Glass radius={18} padding={14} className="space-y-2">
        <MetaRow k="Rate" v={<>1 {quote.soldToken} = <span className="gl-tnum">{formatAmount(quote.rate)}</span> {quote.boughtToken}</>} />
        <MetaRow k="Slippage" v={formatBps(quote.slippageBps)} />
        <MetaRow k="Route" v={<span className="truncate inline-block max-w-[160px] align-bottom">Best via {quote.resolverName}</span>} />
      </Glass>

      {/* Expiry */}
      <div className="flex items-center justify-between px-1" style={{ fontSize: 11 }}>
        <span className="text-subtle">
          {!quote.isLive && <span className="text-muted">Demo · </span>}
          {isExpired ? <span className="text-fg">Quote expired</span> : <>Expires in <span className="text-fg gl-tnum" style={{ fontWeight: 600 }}>{secsLeft}s</span></>}
        </span>
        <span className="text-faint">{quote.routeSummary}</span>
      </div>

      {isExpired ? (
        <SecondaryButton onClick={onRefresh}>↻ Refresh quote</SecondaryButton>
      ) : (
        <PrimaryButton onClick={onConfirm} disabled={isPreparing}>
          {isPreparing ? "Preparing…" : "Confirm quote"}
        </PrimaryButton>
      )}
    </div>
  );
}

function PreparedView({
  messages, validUntil, onSend, isConnected, onConnect, isSending, sendError, isDemo,
}: {
  messages: { address: string }[]; validUntil: number; onSend: () => void;
  isConnected: boolean; onConnect: () => void; isSending: boolean; sendError: string | null; isDemo: boolean;
}) {
  const secsLeft = useCountdown(new Date(validUntil * 1000));
  return (
    <div className="space-y-3">
      <Glass radius={20} padding={16}>
        <div className="text-subtle" style={{ fontSize: 11, marginBottom: 4 }}>Transaction ready</div>
        <div className="text-fg" style={{ fontSize: 17, fontWeight: 700 }}>
          {messages.length} message{messages.length > 1 ? "s" : ""}
        </div>
        <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>
          valid for <span className="text-fg gl-tnum" style={{ fontWeight: 600 }}>{secsLeft}s</span>
        </div>
      </Glass>

      {sendError && (
        <div className="rounded-[14px] px-3 py-2" style={{ fontSize: 12, color: "rgb(var(--text1))", background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
          Transaction failed: {sendError}
        </div>
      )}

      {isConnected ? (
        <PrimaryButton onClick={onSend} disabled={isSending || secsLeft === 0}>
          {isSending ? "Signing… open wallet" : secsLeft === 0 ? "Expired · refresh" : "Sign & send"}
        </PrimaryButton>
      ) : (
        <div className="space-y-2">
          <p className="text-subtle text-center" style={{ fontSize: 12 }}>Connect your TON wallet to sign</p>
          <SecondaryButton onClick={onConnect}>Connect wallet</SecondaryButton>
        </div>
      )}

      {isDemo && (
        <p className="text-muted text-center" style={{ fontSize: 11 }}>
          Demo mode · mock messages · no real funds spent
        </p>
      )}
    </div>
  );
}

function SubmittedView({ txHash, onDismiss }: { txHash: string | null; onDismiss: () => void }) {
  return (
    <div className="space-y-3">
      <Glass hi radius={20} padding={18}>
        <div className="text-fg" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>Sent on-chain ✓</div>
        <div className="text-subtle" style={{ fontSize: 12, marginTop: 4 }}>Transaction broadcast. Waiting for confirmation…</div>
        {txHash && (
          <div className="font-mono text-faint" style={{ fontSize: 11, marginTop: 8 }}>boc …{txHash.slice(-16)}</div>
        )}
      </Glass>
      <SecondaryButton onClick={onDismiss}>Close</SecondaryButton>
    </div>
  );
}

export function GlassQuoteCard({ onDismiss, ...params }: GlassQuoteCardProps) {
  const { flow, wallet, actions, step, isSending, sendError, handleConfirm, handleRefresh, handleSend, isExpired } =
    useQuoteFlow(params);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-fg" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>Confirm copy</div>
          <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>
            {params.soldToken} → {params.boughtToken} · exec …{params.executionId.slice(-6)}
          </div>
        </div>
        <button onClick={onDismiss} aria-label="dismiss"
          className="w-8 h-8 flex items-center justify-center rounded-full text-subtle"
          style={{ background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
          ✕
        </button>
      </div>

      <div className="mb-3 rounded-[14px] px-3 py-2 text-subtle" style={{ fontSize: 11, background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
        🔑 Non-custodial — you review and sign every copy from your own wallet. TonMirror never holds your funds.
      </div>

      {flow.isQuoting && (
        <div className="space-y-3">
          <Glass radius={20} padding={16}>
            <div className="grid items-center" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 8 }}>
              <div className="space-y-1.5"><Skeleton className="h-3 w-12" /><Skeleton className="h-6 w-20" /></div>
              <div />
              <div className="space-y-1.5 flex flex-col items-end"><Skeleton className="h-3 w-12" /><Skeleton className="h-6 w-20" /></div>
            </div>
          </Glass>
          <p className="text-subtle text-center" style={{ fontSize: 12 }}>Fetching best quote…</p>
        </div>
      )}

      {!flow.isQuoting && (flow.quoteError || flow.prepareError) && (
        <div className="space-y-3">
          <div className="rounded-[14px] px-3 py-2" style={{ fontSize: 12, color: "rgb(var(--text1))", background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
            {flow.quoteError ?? flow.prepareError}
          </div>
          <SecondaryButton onClick={handleRefresh}>↻ Try again</SecondaryButton>
        </div>
      )}

      {step === "quoted" && flow.quote && !flow.isQuoting && !flow.quoteError && (
        <QuoteDetails quote={flow.quote} onConfirm={handleConfirm} onRefresh={handleRefresh} isPreparing={flow.isPreparing} isExpired={isExpired} />
      )}

      {step === "prepared" && flow.prepared && (
        <PreparedView
          messages={flow.prepared.messages} validUntil={flow.prepared.validUntil}
          onSend={handleSend} isConnected={wallet.isConnected} onConnect={actions.connect}
          isSending={isSending} sendError={sendError} isDemo={!(flow.quote?.isLive ?? false)}
        />
      )}

      {step === "submitted" && (
        <SubmittedView txHash={flow.submitResult?.txHash ?? null} onDismiss={onDismiss} />
      )}
    </div>
  );
}
