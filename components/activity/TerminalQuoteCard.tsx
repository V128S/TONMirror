"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { CornerBox } from "@/components/terminal/CornerBox";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import { formatAmount, formatBps } from "@/lib/format";
import { useQuoteFlow, type QuoteFlowParams } from "./useQuoteFlow";
import type { NormalizedQuote } from "@/modules/omniston/types";

interface TerminalQuoteCardProps extends QuoteFlowParams {
  onDismiss: () => void;
}

// ─── Countdown ────────────────────────────────────────────────────────────────
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

// ─── Segment row: "key  ............... value" ─────────────────────────────
function MetaRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 tm-mono">
      <span className="text-[10px] text-phos-mid tracking-[0.12em] uppercase whitespace-nowrap">
        ▸ {k}
      </span>
      <span className="flex-1 tm-divider-dash" style={{ marginBottom: 3 }} aria-hidden />
      <span className="text-[11px] text-phos-hi tm-glow-soft text-right">{v}</span>
    </div>
  );
}

// ─── Editable copy size (USD) — re-quotes on Apply / Enter ─────────────────
function TermAmountEditor({ amount, disabled, onApply }: { amount: number; disabled?: boolean; onApply: (n: number) => void }) {
  const [text, setText] = useState(String(amount));
  useEffect(() => { setText(String(amount)); }, [amount]);
  const parsed  = Number(text.replace(",", "."));
  const changed = Number.isFinite(parsed) && parsed > 0 && parsed !== amount;
  const apply   = () => { if (changed) onApply(parsed); };
  const sanitize = (raw: string) => {
    let s = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
    const dot = s.indexOf(".");
    if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
    setText(s);
  };
  return (
    <div className="mb-3">
      <div className="tm-mono text-[9px] text-phos-mid tracking-[0.12em] uppercase mb-1">▸ amount · usd</div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1 border border-phos-border-dim bg-bg-panel px-2 py-2">
          <span className="tm-mono text-phos-mid text-[13px]">$</span>
          <input
            type="text" inputMode="decimal" value={text}
            onChange={(e) => sanitize(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") apply(); }}
            className="flex-1 bg-transparent outline-none tm-mono tm-glow-soft text-phos-hi text-[14px] w-full"
          />
        </div>
        <button onClick={apply} disabled={disabled || !changed}
          className="border border-phos-border bg-bg-panel px-3 py-2 tm-mono text-[11px] text-phos-hi tracking-[0.08em] disabled:opacity-40 whitespace-nowrap">
          [ ↻ UPD ]
        </button>
      </div>
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
  const expColor = secsLeft <= 5 ? "#ff3050" : secsLeft <= 15 ? "#ffd500" : "#00ffaa";

  return (
    <div className="space-y-3">
      <CornerBox className="border border-phos-border bg-bg-panel px-3 py-3">
        <div className="grid grid-cols-2 gap-0 relative">
          <div
            className="absolute left-1/2 top-1 bottom-1 w-px"
            style={{ background: "linear-gradient(180deg, transparent, #00ff66 30%, #00ff66 70%, transparent)", boxShadow: "0 0 6px #00ff66" }}
          />
          <div className="pr-3">
            <div className="text-[9px] text-phos-mid tracking-[0.18em]">:: YOU · SELL</div>
            <div className="tm-disp tm-glow text-[18px] text-phos-hi mt-1">{formatAmount(quote.amountInDecimal)}</div>
            <div className="text-[10px] text-phos-soft mt-0.5 tm-mono">{quote.soldToken}</div>
          </div>
          <div className="pl-3 text-right">
            <div className="text-[9px] text-phos-mid tracking-[0.18em]">RECEIVE ::</div>
            <div className="tm-disp tm-glow text-[18px] mt-1" style={{ color: "#00ffaa" }}>{formatAmount(quote.amountOutDecimal)}</div>
            <div className="text-[10px] text-phos-soft mt-0.5 tm-mono">{quote.boughtToken}</div>
          </div>
        </div>
      </CornerBox>

      <div className="border border-phos-border-dim bg-bg-el px-3 py-2.5 space-y-1.5">
        <MetaRow k="rate" v={<>1 {quote.soldToken} = <span className="text-phos-hi">{formatAmount(quote.rate)}</span> {quote.boughtToken}</>} />
        <MetaRow k="slippage" v={formatBps(quote.slippageBps)} />
        <MetaRow k="route" v={<span className="truncate inline-block max-w-[140px] align-bottom">{quote.routeSummary}</span>} />
        <MetaRow k="resolver" v={<span className="truncate inline-block max-w-[140px] align-bottom">{quote.resolverName}</span>} />
        <MetaRow k="quote.id" v={`…${quote.quoteId.slice(-8)}`} />
      </div>

      <div className="flex items-center justify-between text-[10px] tm-mono">
        <div className="flex items-center gap-1.5">
          {!quote.isLive && <Badge variant="warning">DEMO</Badge>}
          {isExpired ? (
            <span className="text-danger tm-glow">▲ EXPIRED ▲</span>
          ) : (
            <span style={{ color: expColor }}>
              <span className="tm-blink">●</span> EXPIRES IN <span className="tm-glow tm-disp">{String(secsLeft).padStart(2, "0")}s</span>
            </span>
          )}
        </div>
        <span className="text-phos-mid">{isExpired ? "press refresh ↻" : "watching…"}</span>
      </div>

      {isExpired ? (
        <Button variant="secondary" fullWidth size="md" onClick={onRefresh}>↻ REFRESH · QUOTE</Button>
      ) : (
        <Button variant="primary" fullWidth size="md" disabled={isPreparing} onClick={onConfirm}>
          {isPreparing ? "[ PREPARING… ]" : "[ ◢ CONFIRM · QUOTE ◣ ]"}
        </Button>
      )}
    </div>
  );
}

function PreparedView({
  messages, validUntil, onSend, isConnected, onConnect, isSending, sendError, isDemo,
}: {
  messages: { address: string; amount: string; payload: string; stateInit?: string }[];
  validUntil: number; onSend: () => void; isConnected: boolean; onConnect: () => void;
  isSending: boolean; sendError: string | null; isDemo: boolean;
}) {
  const secsLeft = useCountdown(new Date(validUntil * 1000));
  return (
    <div className="space-y-3">
      <CornerBox className="border border-phos bg-bg-panel px-3 py-3 space-y-1.5">
        <div className="text-[9px] text-phos-mid tracking-[0.18em]">:: TX · READY</div>
        <div className="tm-disp tm-glow text-[15px] text-phos-hi">
          {messages.length} MESSAGE{messages.length > 1 ? "S" : ""} <BlinkCaret />
        </div>
        <div className="text-[10px] text-phos-soft tm-mono">valid for <span className="tm-glow">{secsLeft}s</span></div>
        <div className="text-[9px] text-phos-mid font-mono leading-tight pt-1 border-t border-dashed border-phos-border-dim mt-1">
          {messages.slice(0, 3).map((_m, i) => (
            <div key={i}>┝━ msg[{i}] ━━━━━━━━━━━━━━━━━━━━━━━━ <span className="text-phos-soft">READY</span></div>
          ))}
          {messages.length > 3 && <div className="text-phos-mid">… +{messages.length - 3} more</div>}
        </div>
      </CornerBox>

      {sendError && (
        <div className="border border-danger bg-danger/10 text-danger px-3 py-2 text-[11px] tm-mono">
          <span className="tm-glow">✕ TX FAILED ::</span> {sendError}
        </div>
      )}

      {isConnected ? (
        <Button variant="primary" fullWidth size="md" disabled={isSending || secsLeft === 0} onClick={onSend}>
          {isSending ? "[ SIGNING… · OPEN WALLET ]" : secsLeft === 0 ? "[ EXPIRED · REFRESH ]" : "[ ◢ SIGN · & · SEND ◣ ]"}
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-[10px] text-phos-mid tm-mono text-center">▸ connect TON wallet to sign</p>
          <Button variant="secondary" fullWidth size="md" onClick={onConnect}>▸ CONNECT · WALLET</Button>
        </div>
      )}

      {isDemo && (
        <p className="text-[9px] text-warn tm-mono text-center tracking-[0.1em]">
          ⚠ DEMO MODE · MOCK MESSAGES · NO REAL FUNDS SPENT
        </p>
      )}
    </div>
  );
}

function SubmittedView({ txHash, onDismiss }: { txHash: string | null; onDismiss: () => void }) {
  return (
    <div className="space-y-3">
      <CornerBox className="border border-phos bg-bg-panel px-3 py-4 space-y-2">
        <div className="text-[9px] text-phos-mid tracking-[0.18em]">:: TX · SUBMITTED</div>
        <div className="tm-disp tm-glow text-[18px]" style={{ color: "#00ffaa" }}>◈ SENT ON-CHAIN <BlinkCaret /></div>
        <div className="text-[10px] text-phos-soft tm-mono">Transaction broadcast. Waiting for confirmation…</div>
        {txHash && (
          <div className="text-[9px] text-phos-mid tm-mono pt-1 border-t border-dashed border-phos-border-dim mt-1">
            boc ref <span className="text-phos-soft tm-glow-soft">…{txHash.slice(-16)}</span>
          </div>
        )}
      </CornerBox>
      <Button variant="secondary" fullWidth size="sm" onClick={onDismiss}>[ ✓ CLOSE ]</Button>
    </div>
  );
}

export function TerminalQuoteCard({ onDismiss, ...params }: TerminalQuoteCardProps) {
  const { flow, wallet, actions, step, isSending, sendError, amount, requote, handleConfirm, handleRefresh, handleSend, isExpired } =
    useQuoteFlow(params);

  return (
    <Card elevated className="mt-2">
      <CardHeader className="mb-3">
        <div className="flex flex-row items-center justify-between">
          <CardTitle>QUOTE · {params.soldToken} → {params.boughtToken}</CardTitle>
          <button onClick={onDismiss} className="text-phos-mid hover:text-phos-hi text-base leading-none tm-mono px-1.5" aria-label="dismiss">
            [ ✕ ]
          </button>
        </div>
        <div className="mt-1 tm-mono text-[9px] text-phos-mid tracking-[0.12em]">
          exec.id <span className="text-phos-soft">…{params.executionId.slice(-8)}</span>
        </div>
      </CardHeader>

      <CardBody>
        <div className="mb-3 border border-phos-border-dim bg-bg-panel px-3 py-2 tm-mono text-[9px] text-phos-mid tracking-[0.08em] leading-relaxed">
          [ NON-CUSTODIAL ] you review &amp; sign every copy from your own wallet · tonmirror never holds funds
        </div>

        {(step === "idle" || step === "quoted") && (
          <TermAmountEditor amount={amount} disabled={flow.isQuoting} onApply={requote} />
        )}

        {flow.isQuoting && (
          <div className="space-y-3">
            <CornerBox className="border border-phos-border-dim bg-bg-panel px-3 py-3">
              <div className="grid grid-cols-2 gap-0 relative">
                <div className="absolute left-1/2 top-1 bottom-1 w-px" style={{ background: "rgba(0,255,102,0.18)" }} />
                <div className="pr-3 space-y-1.5">
                  <Skeleton className="w-12 h-3" /><Skeleton className="w-20 h-6" /><Skeleton className="w-10 h-3" />
                </div>
                <div className="pl-3 space-y-1.5 text-right">
                  <Skeleton className="w-12 h-3 ml-auto" /><Skeleton className="w-20 h-6 ml-auto" /><Skeleton className="w-10 h-3 ml-auto" />
                </div>
              </div>
            </CornerBox>
            <p className="text-[10px] text-phos-mid text-center tm-mono">
              <span className="tm-blink text-phos">●</span> fetching best quote… <BlinkCaret />
            </p>
          </div>
        )}

        {!flow.isQuoting && (flow.quoteError || flow.prepareError) && (
          <div className="space-y-3">
            <div className="border border-danger bg-danger/10 text-danger px-3 py-2 text-[11px] tm-mono">
              <span className="tm-glow">✕ ERROR ::</span> {flow.quoteError ?? flow.prepareError}
            </div>
            <Button variant="secondary" fullWidth size="sm" onClick={handleRefresh}>↻ TRY · AGAIN</Button>
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
      </CardBody>
    </Card>
  );
}
