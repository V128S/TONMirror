"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "@/components/theme/ThemeProvider";

// ── Glass imports ───────────────────────────────────────────────────────
import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { Sparkline as GlassSparkline } from "@/components/glass/Sparkline";
import { InlineStat }   from "@/components/glass/Stat";
import { MicroToggle }  from "@/components/glass/MicroToggle";

// ── Shared / Terminal imports ───────────────────────────────────────────
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { MirrorBar }   from "@/components/terminal/MirrorBar";
import { CornerBox }   from "@/components/terminal/CornerBox";
import { Sparkline }   from "@/components/fx/Sparkline";
import { RiskMeter }   from "@/components/fx/RiskMeter";
import { BlinkCaret }  from "@/components/fx/BlinkCaret";
import { formatUsd, formatPercent, formatAmount, formatRelativeTime, shortenAddress } from "@/lib/format";
import { useLeader, useFollowLeader } from "@/hooks/useLeaders";
import { useStrategies, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTelegramMainButton, useTelegramSecondaryButton } from "@/hooks/useTelegramButton";

interface FormValues {
  mode: "fixed_amount" | "percent_of_leader";
  fixedAmount: number;
  percentOfLeader: number;
  slippageBps: number;
  requireManualConfirm: boolean;
  copySells: boolean;
}

const DEFAULT_FORM: FormValues = {
  mode: "fixed_amount",
  fixedAmount: 40,
  percentOfLeader: 10,
  slippageBps: 100,
  requireManualConfirm: true,
  copySells: false,
};

/* ── Terminal helpers ────────────────────────────────────────────────── */
function SegPick({ on, children, onClick, small }: {
  on?: boolean; children: React.ReactNode; onClick?: () => void; small?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={`tm-mono font-bold tracking-[0.1em] text-center transition-colors ${small ? "py-1.5 text-[10px]" : "py-2 text-[11px]"} ${on ? "border border-phos bg-phos/10 text-phos-hi" : "border border-phos-border-dim text-phos-mid hover:text-phos-soft"}`}
      style={on ? { boxShadow: "inset 0 0 8px rgba(0,255,102,0.2)" } : undefined}>
      {on && "▸ "}{children}{on && " ◂"}
    </button>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-t border-dashed border-phos-border-dim">
      <div>
        <p className="text-[11px] text-phos-soft tracking-[0.1em] tm-mono">▸ {label}</p>
        <p className="text-[9px] text-phos-mid mt-0.5">{description}</p>
      </div>
      <button onClick={() => onChange(!checked)} className="tm-mono text-[10px] tracking-[0.2em]"
        style={{ color: checked ? "#c8ffd8" : "#4a8a5e" }}>
        {checked ? "[ ◼ ON ]" : "[ ◻ OFF ]"}
      </button>
    </div>
  );
}

/* ── Shared strategy form — theme-aware internally via Card/Button ───── */
function StrategyForm({ leaderId, userId, onSuccess, isGlass }: { leaderId: string; userId: string; onSuccess: () => void; isGlass: boolean }) {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const follow = useFollowLeader();
  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    try {
      await follow.mutateAsync({ leaderWalletId: leaderId, userId, mode: form.mode,
        fixedAmount: form.mode === "fixed_amount" ? form.fixedAmount : undefined,
        requireManualConfirm: form.requireManualConfirm });
      onSuccess();
    } catch (e) { setError(String(e)); }
  };

  if (isGlass) {
    return (
      <div className="space-y-4">
        {/* Mode selector */}
        <div>
          <div className="text-subtle mb-2" style={{ fontSize: 11 }}>Copy mode</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: "fixed_amount" as const, l: "Fixed USDT" },
              { v: "percent_of_leader" as const, l: "% of leader" },
            ].map((opt) => (
              <button key={opt.v} onClick={() => set("mode", opt.v)}
                className="rounded-[14px] py-2.5 text-center transition-colors"
                style={{
                  fontSize: 13, fontWeight: form.mode === opt.v ? 600 : 500,
                  background: form.mode === opt.v ? "rgb(var(--text1))" : "var(--glass-hi)",
                  color: form.mode === opt.v ? "rgb(var(--bg))" : "rgb(var(--text2))",
                  border: "0.5px solid var(--glass-edge)",
                }}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <div className="text-subtle mb-2" style={{ fontSize: 11 }}>
            {form.mode === "fixed_amount" ? "Amount per trade" : "% of leader trade"}
          </div>
          <Glass radius={14} padding={12} className="flex items-center gap-2">
            <input type="number" min={1} max={form.mode === "percent_of_leader" ? 100 : 9999}
              value={form.mode === "fixed_amount" ? form.fixedAmount : form.percentOfLeader}
              onChange={(e) => form.mode === "fixed_amount" ? set("fixedAmount", Number(e.target.value)) : set("percentOfLeader", Number(e.target.value))}
              className="flex-1 bg-transparent text-fg font-mono text-[18px] font-bold outline-none"
              style={{ letterSpacing: "-0.02em" }} />
            <span className="text-subtle" style={{ fontSize: 13 }}>
              {form.mode === "fixed_amount" ? "USDT" : "%"}
            </span>
          </Glass>
        </div>

        {/* Slippage */}
        <div>
          <div className="text-subtle mb-2" style={{ fontSize: 11 }}>Slippage</div>
          <div className="grid grid-cols-4 gap-1.5">
            {[50,100,200,300].map((bps) => (
              <button key={bps} onClick={() => set("slippageBps", bps)}
                className="rounded-[12px] py-2 text-center transition-colors"
                style={{
                  fontSize: 12, fontWeight: form.slippageBps === bps ? 600 : 500,
                  background: form.slippageBps === bps ? "rgb(var(--text1))" : "var(--glass-hi)",
                  color: form.slippageBps === bps ? "rgb(var(--bg))" : "rgb(var(--text2))",
                  border: "0.5px solid var(--glass-edge)",
                }}>
                {bps/100}%
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-0">
          {[
            { key: "requireManualConfirm" as keyof FormValues, label: "Manual confirm", desc: "On: review each quote. Off: auto-quote — you still sign every swap (non-custodial)" },
            { key: "copySells" as keyof FormValues, label: "Copy sells", desc: "Mirror exit orders from leader" },
          ].map((opt, i, arr) => (
            <div key={opt.key} className="flex justify-between items-center py-3"
              style={{ borderBottom: i < arr.length - 1 ? "0.5px solid rgb(var(--hair) / 0.08)" : "none" }}>
              <div>
                <div className="text-fg" style={{ fontSize: 13, fontWeight: 500 }}>{opt.label}</div>
                <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>{opt.desc}</div>
              </div>
              <MicroToggle on={!!form[opt.key]} onChange={(v) => set(opt.key, v)} size="sm" />
            </div>
          ))}
        </div>

        {error && (
          <div className="text-subtle" style={{ fontSize: 12, color: "rgb(var(--text3))" }}>⚠ {error}</div>
        )}

        <Button variant="primary" fullWidth size="lg" onClick={submit} disabled={follow.isPending}>
          {follow.isPending ? "Starting…" : "Start mirroring"}
        </Button>
      </div>
    );
  }

  // Terminal form
  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-1.5">
        <SegPick on={form.mode === "fixed_amount"} onClick={() => set("mode", "fixed_amount")}>FIXED·USDT</SegPick>
        <SegPick on={form.mode === "percent_of_leader"} onClick={() => set("mode", "percent_of_leader")}>%·OF·LEAD</SegPick>
      </div>
      <div>
        <div className="text-[9px] text-phos-mid tracking-[0.15em] mb-1">
          {form.mode === "fixed_amount" ? "AMOUNT · PER · TRADE" : "% OF LEADER TRADE"}
        </div>
        <div className="border border-phos px-3 py-2 flex justify-between items-center tm-mono">
          <span className="text-[15px] text-phos-hi font-bold">
            <BlinkCaret />{form.mode === "fixed_amount" ? `$${form.fixedAmount}.00` : `${form.percentOfLeader}%`}
          </span>
          <input type="number" min={1} max={form.mode === "percent_of_leader" ? 100 : 9999}
            value={form.mode === "fixed_amount" ? form.fixedAmount : form.percentOfLeader}
            onChange={(e) => form.mode === "fixed_amount" ? set("fixedAmount", Number(e.target.value)) : set("percentOfLeader", Number(e.target.value))}
            className="w-20 bg-transparent text-right text-phos-soft text-[11px] outline-none border-l border-phos-border-dim pl-2" />
        </div>
      </div>
      <div>
        <div className="text-[9px] text-phos-mid tracking-[0.15em] mb-1">SLIPPAGE</div>
        <div className="grid grid-cols-4 gap-1">
          {[50,100,200,300].map((bps) => (
            <SegPick key={bps} small on={form.slippageBps === bps} onClick={() => set("slippageBps", bps)}>{bps/100}%</SegPick>
          ))}
        </div>
      </div>
      <div>
        <ToggleRow label="REQUIRE·MANUAL·SIGN" description="on: review each quote · off: auto-quote, you still tap to sign" checked={form.requireManualConfirm} onChange={(v) => set("requireManualConfirm", v)} />
        <ToggleRow label="COPY·SELLS" description="mirror exit orders from leader" checked={form.copySells} onChange={(v) => set("copySells", v)} />
      </div>
      {error && <p className="text-[10px] text-danger bg-danger/10 px-3 py-2 border border-danger/40 tm-mono">! {error}</p>}
      <Button variant="primary" fullWidth onClick={submit} disabled={follow.isPending}>
        {follow.isPending ? "[ DEPLOYING… ]" : "[ ◢ START · COPY · TRADING ◣ ]"}
      </Button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────── */
export default function LeaderDetailPage() {
  const { theme } = useTheme();
  const isGlass = theme !== "terminal";
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { userId } = useCurrentUser();
  const { data: leader, isLoading, isError } = useLeader(id);
  const { data: strategies } = useStrategies(userId ?? undefined);
  const { data: activity, isLoading: activityLoading } = useActivity({ leaderId: id, limit: 10 });

  const isFollowing = strategies?.some((s) => s.leaderWalletId === id) ?? false;
  const [editOpen, setEditOpen] = useState(false);
  const follow = useFollowLeader();
  const pauseM = usePauseStrategy();
  const deleteM = useDeleteStrategy();

  useTelegramMainButton({
    text: isFollowing ? "✓ FOLLOWING" : "🔮 START COPY-TRADING",
    visible: !!leader && !isLoading,
    color: isFollowing ? "#1a6b35" : "#00b34a",
    disabled: follow.isPending || !userId,
    onClick: () => { if (!isFollowing && leader && userId) follow.mutate({ leaderWalletId: leader.id, userId }); },
  });
  useTelegramSecondaryButton({ text: "← BACK", visible: !!leader && !isLoading, onClick: () => router.back() });

  /* ── Loading / Error states ──────────────────────────────────────── */
  if (isLoading) {
    if (!isGlass) return (
      <div>
        <TermHeader title="LOADING…" sub="leader · profile" />
        <div className="px-4 pt-2 space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      </div>
    );
    return (
      <div>
        <PageTitle overline="Leader" title="Loading…" />
        <div className="px-4 space-y-3">
          {[1,2,3].map((i) => <Skeleton key={i} className="h-24 rounded-[22px]" />)}
        </div>
      </div>
    );
  }

  if (isError || !leader) {
    if (!isGlass) return (
      <div>
        <TermHeader title="ERR" sub="leader · not · found" />
        <div className="px-4 pt-12 text-center">
          <p className="tm-disp text-danger text-lg">▲ 404 ▲</p>
          <Link href="/leaders" className="text-phos-soft text-sm mt-3 inline-block">← Back to leaders</Link>
        </div>
      </div>
    );
    return (
      <div>
        <PageTitle overline="Error" title="Not found" />
        <div className="px-4 pt-12 text-center text-subtle">
          <Link href="/leaders" className="text-fg underline">← Back to leaders</Link>
        </div>
      </div>
    );
  }

  const spark = Array.from({ length: 21 }).map(
    (_, i) => 40 + i * 2.2 + Math.sin(i * 0.6) * 8 + leader.activityScore * 12,
  );

  const activeStrategy = strategies?.find((s) => s.leaderWalletId === id);

  /* ── Terminal UI ───────────────────────────────────────────────────── */
  if (theme === "terminal") {
    return (
      <div>
        <TermHeader title={leader.nickname.toUpperCase()} sub={`leader · ${shortenAddress(leader.address)}`} />
        <div className="px-4 pt-2 space-y-3.5">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-[10px] text-phos-mid tm-mono">
            ← LEADERS
          </button>
          {leader.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {leader.tags.map((t) => <Badge key={t} variant="muted">{t}</Badge>)}
            </div>
          )}
          <CornerBox className="border border-phos-border bg-bg-panel p-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] text-phos-mid tracking-[0.15em]">PnL · TREND</span>
              <span className="tm-mono text-[9px] text-phos-mid">{formatRelativeTime(new Date().toISOString())}</span>
            </div>
            <div className="tm-disp tm-glow text-[28px] text-phos-hi mt-1">
              {formatPercent(leader.winRateApprox)} <span className="text-[14px] text-phos-soft">win</span>
            </div>
            <div className="mt-1.5"><Sparkline data={spark} width={310} height={56} /></div>
            <div className="mt-1 flex justify-between text-[9px] text-phos-mid tm-mono">
              <span>30d ago</span><span>14d</span><span>7d</span><span className="text-phos">NOW ▸</span>
            </div>
          </CornerBox>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { l: "WIN", v: formatPercent(leader.winRateApprox), s: leader.isFollowing ? "followed" : "·" },
              { l: "FREQ", v: formatPercent(leader.activityScore), s: "rolling" },
              { l: "RISK", v: `${leader.riskScore.toFixed(1)}/10`, s: leader.riskScore <= 3 ? "low" : leader.riskScore <= 6 ? "med" : "hi" },
            ].map((c) => (
              <div key={c.l} className="border border-phos-border-dim p-2 text-center" style={{ background: "rgba(0,255,102,0.03)" }}>
                <div className="text-[9px] text-phos-mid tracking-[0.15em]">[{c.l}]</div>
                <div className="tm-disp tm-glow text-[15px] text-phos-hi mt-0.5">{c.v}</div>
                <div className="text-[8px] text-phos-mid mt-0.5">{c.s}</div>
              </div>
            ))}
          </div>
          <div className="border border-phos-border-dim px-3 py-2.5">
            <RiskMeter score={leader.riskScore} max={10} label="RISK · SCORE" />
            {leader.notes && <div className="text-[9px] text-phos-mid mt-2 leading-relaxed">▸ {leader.notes}</div>}
          </div>
          {isFollowing && activeStrategy ? (
            <>
              <Card elevated>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>YOUR · STRATEGY</CardTitle>
                    <Badge variant={activeStrategy.isPaused ? "warning" : "success"}>
                      {activeStrategy.isPaused ? "⏸ PAUSED" : "▶ ACTIVE"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-[10px] tm-mono">
                    <div><div className="text-phos-mid">Mode</div><div className="text-phos-hi mt-0.5">{activeStrategy.mode === "fixed_amount" ? `$${activeStrategy.fixedAmount}/trade` : `${activeStrategy.percentOfLeader}% of leader`}</div></div>
                    <div><div className="text-phos-mid">Slippage</div><div className="text-phos-hi mt-0.5">{(activeStrategy.slippageBps/100).toFixed(2)}%</div></div>
                    <div><div className="text-phos-mid">Manual confirm</div><div className="text-phos-hi mt-0.5">{activeStrategy.requireManualConfirm ? "YES" : "NO"}</div></div>
                    <div><div className="text-phos-mid">Copy sells</div><div className="text-phos-hi mt-0.5">{activeStrategy.copySells ? "YES" : "NO"}</div></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="sm" fullWidth disabled={pauseM.isPending} onClick={() => pauseM.mutate({ id: activeStrategy.id, isPaused: !activeStrategy.isPaused })}>
                      {activeStrategy.isPaused ? "RESUME" : "PAUSE"}
                    </Button>
                    <Button variant="danger" size="sm" fullWidth disabled={deleteM.isPending} onClick={() => deleteM.mutate(activeStrategy.id)}>UNFOLLOW</Button>
                  </div>
                </CardBody>
              </Card>
              {!editOpen && <button onClick={() => setEditOpen(true)} className="text-[10px] text-phos-soft underline tm-mono">edit strategy parameters →</button>}
              {editOpen && (
                <Card>
                  <CardHeader><CardTitle>EDIT · STRATEGY</CardTitle></CardHeader>
                  <CardBody><StrategyForm leaderId={id} userId={userId ?? ""} onSuccess={() => setEditOpen(false)} isGlass={false} /></CardBody>
                </Card>
              )}
            </>
          ) : (
            <>
              <MirrorBar label="STRATEGY · CONFIG" />
              <Card elevated>
                <CardHeader>
                  <CardTitle>SET · UP · COPY · STRATEGY</CardTitle>
                  <p className="text-[10px] text-phos-mid mt-1">configure how to mirror {leader.nickname}&apos;s trades.</p>
                </CardHeader>
                <CardBody><StrategyForm leaderId={id} userId={userId ?? ""} onSuccess={() => {}} isGlass={false} /></CardBody>
              </Card>
            </>
          )}
          <div>
            <MirrorBar label="RECENT · TRADES" />
            <div className="mt-1.5 border border-phos-border-dim bg-bg-panel">
              {activityLoading ? (
                <div className="p-2 space-y-1">{[1,2,3].map((i) => <Skeleton key={i} className="w-full h-10" />)}</div>
              ) : activity && activity.length > 0 ? (
                activity.map((e, i) => (
                  <div key={e.id} className={`grid items-center gap-2 px-2.5 py-1.5 text-[10px] ${i ? "border-t border-dashed border-phos-border-dim" : ""}`}
                    style={{ gridTemplateColumns: "52px 1fr auto" }}>
                    <span className="text-phos-mid">{new Date(e.timestamp).toLocaleTimeString("en-GB",{hour12:false}).slice(0,5)}</span>
                    <span className="text-phos-hi tm-mono">{formatAmount(e.soldAmountDecimal)} {e.soldToken} → {e.boughtToken}</span>
                    <span className="text-phos-soft tm-mono">
                      {e.decision && <DecisionBadge decision={e.decision.outcome} />}{" "}
                      {e.usdEstimate != null && formatUsd(e.usdEstimate)}
                    </span>
                  </div>
                ))
              ) : <p className="text-phos-mid text-[10px] text-center py-4">no trades recorded yet.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Glass UI ──────────────────────────────────────────────────────── */
  return (
    <div>
      <PageTitle
        overline={shortenAddress(leader.address)}
        title={prettyName(leader.nickname)}
        right={<RiskBadge score={leader.riskScore} />}
      />

      <div className="px-4 space-y-3.5">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-subtle" style={{ fontSize: 13 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Leaders
        </button>

        {/* Header card */}
        <Glass hi radius={24} padding={20}>
          <div className="grid items-center gap-3 mb-4" style={{ gridTemplateColumns: "52px 1fr" }}>
            <Avatar name={leader.nickname} size={52} />
            <div>
              <div className="text-fg" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em" }}>
                {prettyName(leader.nickname)}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {leader.tags.slice(0, 3).map((t) => (
                  <span key={t} className="rounded-full px-2 py-0.5 text-subtle"
                    style={{ fontSize: 10, background: "var(--chip)", border: "0.5px solid var(--glass-edge)" }}>
                    {t.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3" style={{ marginLeft: -4, marginRight: -4 }}>
            <GlassSparkline data={spark} width={320} height={52} />
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.08)" }}>
            <InlineStat label="Win rate" value={formatPercent(leader.winRateApprox)} />
            <InlineStat label="Activity" value={formatPercent(leader.activityScore)} />
            <InlineStat label="Risk" value={`${leader.riskScore.toFixed(1)}/10`} />
          </div>

          {leader.notes && (
            <div className="text-subtle mt-3 pt-3" style={{ fontSize: 12, borderTop: "0.5px solid rgb(var(--hair) / 0.06)" }}>
              {leader.notes}
            </div>
          )}
        </Glass>

        {/* Strategy section */}
        {isFollowing && activeStrategy ? (
          <>
            <SectionLabel>Your strategy</SectionLabel>
            <Glass radius={22} padding={16}>
              <div className="flex justify-between items-center mb-3">
                <div className="text-fg" style={{ fontSize: 14, fontWeight: 600 }}>Active mirror</div>
                <Badge variant={activeStrategy.isPaused ? "warning" : "success"}>
                  {activeStrategy.isPaused ? "Paused" : "Active"}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-subtle" style={{ fontSize: 11 }}>Mode</div>
                  <div className="text-fg" style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                    {activeStrategy.mode === "fixed_amount" ? `$${activeStrategy.fixedAmount}/trade` : `${activeStrategy.percentOfLeader}% of leader`}
                  </div>
                </div>
                <div>
                  <div className="text-subtle" style={{ fontSize: 11 }}>Slippage</div>
                  <div className="text-fg" style={{ fontSize: 13, fontWeight: 500, marginTop: 2 }}>
                    {(activeStrategy.slippageBps/100).toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" fullWidth disabled={pauseM.isPending}
                  onClick={() => pauseM.mutate({ id: activeStrategy.id, isPaused: !activeStrategy.isPaused })}>
                  {activeStrategy.isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="danger" size="sm" fullWidth disabled={deleteM.isPending}
                  onClick={() => deleteM.mutate(activeStrategy.id)}>
                  Unfollow
                </Button>
              </div>
            </Glass>

            {!editOpen && (
              <button onClick={() => setEditOpen(true)} className="text-subtle underline-offset-2 hover:underline px-1" style={{ fontSize: 12 }}>
                Edit strategy →
              </button>
            )}
            {editOpen && (
              <Glass radius={22} padding={16}>
                <div className="text-fg mb-4" style={{ fontSize: 14, fontWeight: 600 }}>Edit strategy</div>
                <StrategyForm leaderId={id} userId={userId ?? ""} onSuccess={() => setEditOpen(false)} isGlass />
              </Glass>
            )}
          </>
        ) : (
          <>
            <SectionLabel>Set up copy strategy</SectionLabel>
            <Glass radius={22} padding={16}>
              <div className="text-subtle mb-4" style={{ fontSize: 12 }}>
                Configure how to mirror {prettyName(leader.nickname)}&apos;s trades.
              </div>
              <StrategyForm leaderId={id} userId={userId ?? ""} onSuccess={() => {}} isGlass />
            </Glass>
          </>
        )}

        {/* Recent trades */}
        <div>
          <SectionLabel right={`${activity?.length ?? 0} trades`}>Recent trades</SectionLabel>
          <Glass radius={22} padding={0} className="overflow-hidden">
            {activityLoading ? (
              <div className="p-3 space-y-2">
                {[1,2,3].map((i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : activity && activity.length > 0 ? (
              activity.map((e, i, arr) => (
                <div key={e.id}
                  className="grid items-center gap-2.5 px-3.5 py-3"
                  style={{ gridTemplateColumns: "48px 1fr auto", borderBottom: i < arr.length-1 ? "0.5px solid rgb(var(--hair)/0.08)" : "none" }}>
                  <span className="font-mono text-subtle" style={{ fontSize: 11 }}>
                    {new Date(e.timestamp).toLocaleTimeString("en-GB",{hour12:false}).slice(0,5)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-fg truncate" style={{ fontSize: 13, fontWeight: 500 }}>
                      {formatAmount(e.soldAmountDecimal)} {e.soldToken} → {e.boughtToken}
                    </div>
                    <div className="text-subtle" style={{ fontSize: 11, marginTop: 1 }}>
                      {formatRelativeTime(e.timestamp)}
                    </div>
                  </div>
                  <div className="text-right">
                    {e.decision && <DecisionBadge decision={e.decision.outcome} />}
                    {e.usdEstimate != null && (
                      <div className="text-subtle gl-tnum" style={{ fontSize: 11, marginTop: 2 }}>
                        {formatUsd(e.usdEstimate)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-subtle" style={{ fontSize: 12 }}>No trades recorded yet.</div>
            )}
          </Glass>
        </div>
      </div>
    </div>
  );
}
