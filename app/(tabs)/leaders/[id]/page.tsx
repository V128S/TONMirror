"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge, DecisionBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TermHeader } from "@/components/terminal/TermHeader";
import { MirrorBar } from "@/components/terminal/MirrorBar";
import { CornerBox } from "@/components/terminal/CornerBox";
import { Sparkline } from "@/components/fx/Sparkline";
import { RiskMeter } from "@/components/fx/RiskMeter";
import { BlinkCaret } from "@/components/fx/BlinkCaret";
import {
  formatUsd,
  formatPercent,
  formatAmount,
  formatRelativeTime,
  shortenAddress,
} from "@/lib/format";
import { useLeader, useFollowLeader } from "@/hooks/useLeaders";
import { useStrategies, usePauseStrategy, useDeleteStrategy } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
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

function SegPick({
  on,
  children,
  onClick,
  small,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`tm-mono font-bold tracking-[0.1em] text-center transition-colors ${
        small ? "py-1.5 text-[10px]" : "py-2 text-[11px]"
      } ${
        on
          ? "border border-phos bg-phos/10 text-phos-hi"
          : "border border-phos-border-dim text-phos-mid hover:text-phos-soft"
      }`}
      style={on ? { boxShadow: "inset 0 0 8px rgba(0,255,102,0.2)" } : undefined}
    >
      {on && "▸ "}{children}{on && " ◂"}
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-t border-dashed border-phos-border-dim">
      <div>
        <p className="text-[11px] text-phos-soft tracking-[0.1em] tm-mono">▸ {label}</p>
        <p className="text-[9px] text-phos-mid mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="tm-mono text-[10px] tracking-[0.2em]"
        style={{ color: checked ? "#c8ffd8" : "#4a8a5e" }}
      >
        {checked ? "[ ◼ ON ]" : "[ ◻ OFF ]"}
      </button>
    </div>
  );
}

function StrategyForm({ leaderId, onSuccess }: { leaderId: string; onSuccess: () => void }) {
  const [form, setForm] = useState<FormValues>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);
  const follow = useFollowLeader();

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    setError(null);
    try {
      await follow.mutateAsync({
        leaderWalletId: leaderId,
        mode: form.mode,
        fixedAmount: form.mode === "fixed_amount" ? form.fixedAmount : undefined,
        requireManualConfirm: form.requireManualConfirm,
      });
      onSuccess();
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-1.5">
        <SegPick on={form.mode === "fixed_amount"} onClick={() => set("mode", "fixed_amount")}>
          FIXED·USDT
        </SegPick>
        <SegPick on={form.mode === "percent_of_leader"} onClick={() => set("mode", "percent_of_leader")}>
          %·OF·LEAD
        </SegPick>
      </div>

      <div>
        <div className="text-[9px] text-phos-mid tracking-[0.15em] mb-1">
          {form.mode === "fixed_amount" ? "AMOUNT · PER · TRADE" : "% OF LEADER TRADE"}
        </div>
        <div className="border border-phos px-3 py-2 flex justify-between items-center tm-mono">
          <span className="text-[15px] text-phos-hi font-bold">
            <BlinkCaret />
            {form.mode === "fixed_amount" ? `$${form.fixedAmount}.00` : `${form.percentOfLeader}%`}
          </span>
          <input
            type="number"
            min={1}
            max={form.mode === "percent_of_leader" ? 100 : 9999}
            value={form.mode === "fixed_amount" ? form.fixedAmount : form.percentOfLeader}
            onChange={(e) =>
              form.mode === "fixed_amount"
                ? set("fixedAmount", Number(e.target.value))
                : set("percentOfLeader", Number(e.target.value))
            }
            className="w-20 bg-transparent text-right text-phos-soft text-[11px] outline-none border-l border-phos-border-dim pl-2"
          />
        </div>
      </div>

      <div>
        <div className="text-[9px] text-phos-mid tracking-[0.15em] mb-1">SLIPPAGE</div>
        <div className="grid grid-cols-4 gap-1">
          {[50, 100, 200, 300].map((bps) => (
            <SegPick
              key={bps}
              small
              on={form.slippageBps === bps}
              onClick={() => set("slippageBps", bps)}
            >
              {bps / 100}%
            </SegPick>
          ))}
        </div>
      </div>

      <div>
        <ToggleRow
          label="REQUIRE·MANUAL·SIGN"
          description="review every quote before signing"
          checked={form.requireManualConfirm}
          onChange={(v) => set("requireManualConfirm", v)}
        />
        <ToggleRow
          label="COPY·SELLS"
          description="mirror exit orders from leader"
          checked={form.copySells}
          onChange={(v) => set("copySells", v)}
        />
      </div>

      {error && (
        <p className="text-[10px] text-danger bg-danger/10 px-3 py-2 border border-danger/40 tm-mono">
          ! {error}
        </p>
      )}

      <Button variant="primary" fullWidth onClick={submit} disabled={follow.isPending}>
        {follow.isPending ? "[ DEPLOYING… ]" : "[ ◢ START · COPY · TRADING ◣ ]"}
      </Button>
    </div>
  );
}

function ActiveStrategyCard({ leaderId }: { leaderId: string }) {
  const { data: strategies } = useStrategies();
  const pauseM = usePauseStrategy();
  const deleteM = useDeleteStrategy();

  const s = strategies?.find((s) => s.leaderWalletId === leaderId);
  if (!s) return null;

  const modeLabel =
    s.mode === "fixed_amount"
      ? `$${s.fixedAmount ?? "?"} / trade`
      : `${s.percentOfLeader ?? "?"}% of leader`;

  return (
    <Card elevated>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>YOUR · STRATEGY</CardTitle>
          <Badge variant={s.isPaused ? "warning" : "success"}>
            {s.isPaused ? "⏸ PAUSED" : "▶ ACTIVE"}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-[10px] tm-mono">
          <div>
            <div className="text-phos-mid">Mode</div>
            <div className="text-phos-hi mt-0.5">{modeLabel}</div>
          </div>
          <div>
            <div className="text-phos-mid">Slippage</div>
            <div className="text-phos-hi mt-0.5">{(s.slippageBps / 100).toFixed(2)}%</div>
          </div>
          <div>
            <div className="text-phos-mid">Manual confirm</div>
            <div className="text-phos-hi mt-0.5">{s.requireManualConfirm ? "YES" : "NO"}</div>
          </div>
          <div>
            <div className="text-phos-mid">Copy sells</div>
            <div className="text-phos-hi mt-0.5">{s.copySells ? "YES" : "NO"}</div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            disabled={pauseM.isPending}
            onClick={() => pauseM.mutate({ id: s.id, isPaused: !s.isPaused })}
          >
            {s.isPaused ? "RESUME" : "PAUSE"}
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            disabled={deleteM.isPending}
            onClick={() => deleteM.mutate(s.id)}
          >
            UNFOLLOW
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function LeaderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: leader, isLoading, isError } = useLeader(id);
  const { data: strategies } = useStrategies();
  const { data: activity, isLoading: activityLoading } = useActivity({ leaderId: id, limit: 10 });

  const isFollowing = strategies?.some((s) => s.leaderWalletId === id) ?? false;
  const [editOpen, setEditOpen] = useState(false);
  const follow = useFollowLeader();

  // ── Нативные кнопки Telegram ──────────────────────────────────────────────
  // Зелёная кнопка снизу — "FOLLOW" когда не следим, "FOLLOWING ✓" когда следим
  useTelegramMainButton({
    text:     isFollowing ? "✓ FOLLOWING" : "🔮 START COPY-TRADING",
    visible:  !!leader && !isLoading,
    color:    isFollowing ? "#1a6b35" : "#00b34a",
    disabled: follow.isPending,
    onClick:  () => {
      if (!isFollowing && leader) {
        follow.mutate({ leaderWalletId: leader.id });
      }
    },
  });

  // Серая кнопка рядом — "BACK" (SecondaryButton, Bot API 7.10+)
  useTelegramSecondaryButton({
    text:    "← BACK",
    visible: !!leader && !isLoading,
    onClick: () => router.back(),
  });

  if (isLoading) {
    return (
      <div>
        <TermHeader title="LOADING…" sub="leader · profile" />
        <div className="px-4 pt-2 space-y-3">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !leader) {
    return (
      <div>
        <TermHeader title="ERR" sub="leader · not · found" />
        <div className="px-4 pt-12 text-center">
          <p className="tm-disp text-danger text-lg">▲ 404 ▲</p>
          <Link href="/leaders" className="text-phos-soft text-sm mt-3 inline-block">
            ← Back to leaders
          </Link>
        </div>
      </div>
    );
  }

  const spark = Array.from({ length: 21 }).map(
    (_, i) => 40 + i * 2.2 + Math.sin(i * 0.6) * 8 + leader.activityScore * 12,
  );

  return (
    <div>
      <TermHeader title={leader.nickname.toUpperCase()} sub={`leader · ${shortenAddress(leader.address)}`} />

      <div className="px-4 pt-2 space-y-3.5">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[10px] text-phos-mid tm-mono"
        >
          ← LEADERS
        </button>

        {leader.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {leader.tags.map((t) => (
              <Badge key={t} variant="muted">
                {t}
              </Badge>
            ))}
          </div>
        )}

        {/* PnL/spark panel */}
        <CornerBox className="border border-phos-border bg-bg-panel p-3">
          <div className="flex justify-between items-baseline">
            <span className="text-[9px] text-phos-mid tracking-[0.15em]">PnL · TREND</span>
            <span className="tm-mono text-[9px] text-phos-mid">
              {formatRelativeTime(new Date().toISOString())}
            </span>
          </div>
          <div className="tm-disp tm-glow text-[28px] text-phos-hi mt-1">
            {formatPercent(leader.winRateApprox)} <span className="text-[14px] text-phos-soft">win</span>
          </div>
          <div className="mt-1.5">
            <Sparkline data={spark} width={310} height={56} />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-phos-mid tm-mono">
            <span>30d ago</span>
            <span>14d</span>
            <span>7d</span>
            <span className="text-phos">NOW ▸</span>
          </div>
        </CornerBox>

        <div className="grid grid-cols-3 gap-1.5">
          {[
            { l: "WIN", v: formatPercent(leader.winRateApprox), s: leader.isFollowing ? "followed" : "·" },
            { l: "FREQ", v: formatPercent(leader.activityScore), s: "rolling" },
            { l: "RISK", v: `${leader.riskScore.toFixed(1)}/10`, s: leader.riskScore <= 3 ? "low" : leader.riskScore <= 6 ? "med" : "hi" },
          ].map((c) => (
            <div
              key={c.l}
              className="border border-phos-border-dim p-2 text-center"
              style={{ background: "rgba(0,255,102,0.03)" }}
            >
              <div className="text-[9px] text-phos-mid tracking-[0.15em]">[{c.l}]</div>
              <div className="tm-disp tm-glow text-[15px] text-phos-hi mt-0.5">{c.v}</div>
              <div className="text-[8px] text-phos-mid mt-0.5">{c.s}</div>
            </div>
          ))}
        </div>

        <div className="border border-phos-border-dim px-3 py-2.5">
          <RiskMeter score={leader.riskScore} max={10} label="RISK · SCORE" />
          {leader.notes && (
            <div className="text-[9px] text-phos-mid mt-2 leading-relaxed">▸ {leader.notes}</div>
          )}
        </div>

        {/* Strategy section */}
        {isFollowing ? (
          <>
            <ActiveStrategyCard leaderId={id} />
            {!editOpen && (
              <button
                onClick={() => setEditOpen(true)}
                className="text-[10px] text-phos-soft underline tm-mono"
              >
                edit strategy parameters →
              </button>
            )}
            {editOpen && (
              <Card>
                <CardHeader>
                  <CardTitle>EDIT · STRATEGY</CardTitle>
                </CardHeader>
                <CardBody>
                  <StrategyForm leaderId={id} onSuccess={() => setEditOpen(false)} />
                </CardBody>
              </Card>
            )}
          </>
        ) : (
          <>
            <MirrorBar label="STRATEGY · CONFIG" />
            <Card elevated>
              <CardHeader>
                <CardTitle>SET · UP · COPY · STRATEGY</CardTitle>
                <p className="text-[10px] text-phos-mid mt-1">
                  configure how to mirror {leader.nickname}&apos;s trades.
                </p>
              </CardHeader>
              <CardBody>
                <StrategyForm leaderId={id} onSuccess={() => {}} />
              </CardBody>
            </Card>
          </>
        )}

        {/* Recent trades */}
        <div>
          <MirrorBar label="RECENT · TRADES" />
          <div className="mt-1.5 border border-phos-border-dim bg-bg-panel">
            {activityLoading ? (
              <div className="p-2 space-y-1">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="w-full h-10" />
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              activity.map((e, i) => (
                <div
                  key={e.id}
                  className={`grid items-center gap-2 px-2.5 py-1.5 text-[10px] ${
                    i ? "border-t border-dashed border-phos-border-dim" : ""
                  }`}
                  style={{ gridTemplateColumns: "52px 1fr auto" }}
                >
                  <span className="text-phos-mid">
                    {new Date(e.timestamp).toLocaleTimeString("en-GB", { hour12: false }).slice(0, 5)}
                  </span>
                  <span className="text-phos-hi tm-mono">
                    {formatAmount(e.soldAmountDecimal)} {e.soldToken} → {e.boughtToken}
                  </span>
                  <span className="text-phos-soft tm-mono">
                    {e.decision && <DecisionBadge decision={e.decision.outcome} />}
                    {" "}
                    {e.usdEstimate != null && formatUsd(e.usdEstimate)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-phos-mid text-[10px] text-center py-4">no trades recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
