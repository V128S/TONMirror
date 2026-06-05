"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme, type AppTheme } from "@/components/theme/ThemeProvider";

import { Glass }        from "@/components/glass/Glass";
import { PageTitle }    from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar }       from "@/components/glass/Avatar";
import { SettingRow }   from "@/components/glass/SettingRow";
import { MicroToggle }  from "@/components/glass/MicroToggle";
import { Button as GlassButton } from "@/components/ui/Button";
import { Badge as GlassBadge }   from "@/components/ui/Badge";

import { ConnectButton } from "@/components/wallet/ConnectButton";
import { isDemoMode } from "@/lib/env";
import { useEmitDemoTrade, useResetDemoData } from "@/hooks/useActivity";
import { useRunWhaleScanner, type ScanResult } from "@/hooks/useWhaleScanner";
import { formatUsd } from "@/lib/format";
import { ONBOARDED_KEY } from "@/components/onboarding/OnboardingManager";

type FeedbackState = { type: "success" | "error"; message: string } | null;

const PROFILE_KEY = "tonmirror-profile";
interface ProfileData { displayName: string; bio: string }

export const THEME_OPTIONS: { value: AppTheme; label: string; desc: string }[] = [
  { value: "glass",      label: "Light Glass",  desc: "Crystal white · default" },
  { value: "glass-dark", label: "Dark Glass",   desc: "Smoke glass · dark mode" },
  { value: "terminal",   label: "Terminal",     desc: "CRT · legacy · phosphor" },
];

export interface SettingsViewProps {
  user: {
    firstName: string;
    lastName?: string | null;
    username?: string | null;
    id: number;
  } | null;
  wallet: {
    isConnected: boolean;
    address: string | null;
    walletName: string | null;
  };
}

/* ── Glass Settings screen ─────────────────────────────────────────────── */
export function GlassSettings({ user, wallet }: SettingsViewProps) {
  const { theme, setTheme } = useTheme();
  const emitTrade   = useEmitDemoTrade();
  const resetDemo   = useResetDemoData();
  const scanner     = useRunWhaleScanner();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Profile editing
  const [profile, setProfile] = useState<ProfileData>({ displayName: "", bio: "" });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editName, setEditName]   = useState("");
  const [editBio,  setEditBio]    = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) setProfile(JSON.parse(saved) as ProfileData);
    } catch { /* ignore */ }
  }, []);

  const startEditProfile = () => {
    const defaultName = user ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : "";
    setEditName(profile.displayName || defaultName);
    setEditBio(profile.bio);
    setEditingProfile(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const saveProfile = () => {
    const next: ProfileData = { displayName: editName.trim(), bio: editBio.trim() };
    setProfile(next);
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setEditingProfile(false);
    showFeedback("success", "Profile saved.");
  };

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleEmit = async (tradeType: "profitable" | "risky" | "blocked_token") => {
    try {
      const result = await emitTrade.mutateAsync(tradeType);
      const dec = result.decisionsCreated === 0
        ? "no active strategies to evaluate."
        : `${result.decisionsCreated} decision(s) created.`;
      showFeedback("success", `${result.trade.soldToken} → ${result.trade.boughtToken} emitted. ${dec}`);
    } catch (err) { showFeedback("error", String(err)); }
  };

  const handleReset = async () => {
    try {
      await resetDemo.mutateAsync();
      showFeedback("success", "demo data reset to initial state.");
    } catch (err) { showFeedback("error", String(err)); }
  };

  const isPending = emitTrade.isPending || resetDemo.isPending;
  const themeName = theme === "glass" ? "Light Glass" : "Dark Glass";

  return (
    <div>
      <PageTitle overline="Preferences" title="Settings" />
      <div className="px-4 space-y-3.5">
        {/* Feedback banner */}
        {feedback && (
          <Glass radius={14} padding={12}
            className={feedback.type === "success" ? "border-green-200/30" : "border-red-300/30"}
            style={{ fontSize: 13 }}>
            <span className="text-fg">{feedback.type === "success" ? "✓ " : "✕ "}{feedback.message}</span>
          </Glass>
        )}

        {/* Profile */}
        <SectionLabel right={
          !editingProfile && (
            <button
              onClick={startEditProfile}
              className="text-subtle active:opacity-60 transition-opacity"
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              Edit
            </button>
          )
        }>Profile</SectionLabel>
        <Glass radius={22} padding={0} className="overflow-hidden">
          {editingProfile ? (
            <div className="px-4 py-4 space-y-3">
              <div>
                <div className="text-subtle" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Display Name
                </div>
                <input
                  ref={nameInputRef}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  className="w-full rounded-[14px] px-3 py-2.5 text-fg outline-none"
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    background: "var(--glass-hi, rgba(0,0,0,0.04))",
                    border: "1px solid var(--glass-edge, rgba(0,0,0,0.08))",
                    color: "rgb(var(--text1))",
                  }}
                />
              </div>
              <div>
                <div className="text-subtle" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                  Bio
                </div>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="A short bio…"
                  maxLength={120}
                  rows={2}
                  className="w-full rounded-[14px] px-3 py-2.5 text-fg outline-none resize-none"
                  style={{
                    fontSize: 13,
                    background: "var(--glass-hi, rgba(0,0,0,0.04))",
                    border: "1px solid var(--glass-edge, rgba(0,0,0,0.08))",
                    color: "rgb(var(--text1))",
                  }}
                />
              </div>
              <div className="flex gap-2">
                <GlassButton variant="primary" size="sm" fullWidth onClick={saveProfile}>Save</GlassButton>
                <GlassButton variant="secondary" size="sm" fullWidth onClick={() => setEditingProfile(false)}>Cancel</GlassButton>
              </div>
            </div>
          ) : (
            <div className="grid items-center gap-3 px-3 py-4" style={{ gridTemplateColumns: "44px 1fr" }}>
              <Avatar name={profile.displayName || user?.firstName || "User"} size={44} />
              <div>
                <div className="text-fg" style={{ fontSize: 15, fontWeight: 600 }}>
                  {profile.displayName ||
                    (user ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}` : "Loading…")}
                </div>
                {profile.bio ? (
                  <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>{profile.bio}</div>
                ) : user?.username ? (
                  <div className="text-subtle" style={{ fontSize: 12, marginTop: 2 }}>@{user.username}</div>
                ) : null}
              </div>
            </div>
          )}
        </Glass>

        {/* Wallet */}
        <SectionLabel>Wallet</SectionLabel>
        <Glass radius={22} padding={16}>
          {wallet.isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fg shrink-0" style={{ boxShadow: "0 0 4px rgb(var(--text1))" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-fg font-mono truncate" style={{ fontSize: 12 }}>{wallet.address}</div>
                  {wallet.walletName && (
                    <div className="text-subtle" style={{ fontSize: 11, marginTop: 2 }}>{wallet.walletName}</div>
                  )}
                </div>
              </div>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-subtle" style={{ fontSize: 13 }}>Connect your TON wallet to sign copy-trade transactions.</div>
              <ConnectButton />
            </div>
          )}
        </Glass>

        {/* Appearance */}
        <SectionLabel>Appearance</SectionLabel>
        <Glass radius={22} padding={0} className="overflow-hidden">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>}
            label="Theme"
            right={<span className="text-subtle" style={{ fontSize: 12 }}>{themeName}</span>}
            onClick={() => setShowThemePicker((p) => !p)}
          />
          {showThemePicker && (
            <div className="px-3 pb-3 space-y-1.5" style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.08)" }}>
              <div className="pt-2 text-subtle" style={{ fontSize: 11, marginBottom: 8 }}>Select appearance</div>
              {THEME_OPTIONS.slice(0, 2).map((opt) => (
                <button key={opt.value} onClick={() => { setTheme(opt.value); setShowThemePicker(false); }}
                  className="w-full text-left rounded-[14px] px-3 py-2.5 transition-colors"
                  style={{
                    background: theme === opt.value ? "rgb(var(--text1))" : "var(--glass-hi)",
                    color: theme === opt.value ? "rgb(var(--bg))" : "rgb(var(--text1))",
                    border: "0.5px solid var(--glass-edge)",
                    fontSize: 13, fontWeight: theme === opt.value ? 600 : 500,
                  }}>
                  {opt.label}
                  <span style={{ opacity: 0.6, fontSize: 11, marginLeft: 8, fontWeight: 400 }}>{opt.desc}</span>
                </button>
              ))}
              {/* Terminal is a hidden/legacy option — accessible but visually de-emphasised */}
              <div style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.06)", marginTop: 8, paddingTop: 8 }}>
                <div className="text-subtle" style={{ fontSize: 10, letterSpacing: "0.04em", marginBottom: 6 }}>LEGACY</div>
                <button onClick={() => { setTheme("terminal"); setShowThemePicker(false); }}
                  className="w-full text-left rounded-[14px] px-3 py-2.5 transition-colors"
                  style={{
                    background: "var(--chip)", color: "rgb(var(--text3))",
                    border: "0.5px solid rgb(var(--hair) / 0.08)",
                    fontSize: 12, fontWeight: 500,
                  }}>
                  Terminal (Legacy)
                  <span style={{ opacity: 0.5, fontSize: 10, marginLeft: 8 }}>CRT · phosphor</span>
                </button>
              </div>
            </div>
          )}
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            label="Dark glass"
            control={<MicroToggle on={theme === "glass-dark"} onChange={(v) => setTheme(v ? "glass-dark" : "glass")} />}
            last
          />
        </Glass>

        {/* Preferences */}
        <SectionLabel>Preferences</SectionLabel>
        <Glass radius={22} padding={0} className="overflow-hidden">
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>}
            label="Push notifications"
            control={<MicroToggle on={true} size="sm" />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
            label="Auto-approve trades"
            control={<MicroToggle on={false} size="sm" />}
          />
          <SettingRow
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 7 13 7 13 17"/><polyline points="1 17 11 17 11 7"/></svg>}
            label="Haptic feedback"
            control={<MicroToggle on={true} size="sm" />}
            last
          />
        </Glass>

        {/* Demo controls */}
        {isDemoMode && (
          <>
            <SectionLabel right={<GlassBadge variant="warning">DEMO</GlassBadge>}>Demo Controls</SectionLabel>
            <Glass radius={22} padding={16} className="space-y-2">
              <div className="text-subtle" style={{ fontSize: 12, marginBottom: 8 }}>
                Emit fake trades to demonstrate the copy-trading pipeline to judges.
              </div>
              <GlassButton variant="secondary" fullWidth size="md" disabled={isPending} onClick={() => handleEmit("profitable")}>
                ⚡ Emit profitable trade
              </GlassButton>
              <GlassButton variant="secondary" fullWidth size="md" disabled={isPending} onClick={() => handleEmit("risky")}>
                ⚠ Emit risky trade
              </GlassButton>
              <GlassButton variant="secondary" fullWidth size="md" disabled={isPending} onClick={() => handleEmit("blocked_token")}>
                ⊘ Emit blocked-token trade
              </GlassButton>
              <div style={{ borderTop: "0.5px solid rgb(var(--hair) / 0.08)", paddingTop: 8, marginTop: 4 }}>
                <GlassButton variant="danger" fullWidth size="md" disabled={isPending} onClick={handleReset}>
                  ↻ Reset demo data
                </GlassButton>
              </div>
            </Glass>
          </>
        )}

        {/* Whale scanner */}
        <SectionLabel right={<GlassBadge variant="muted">AUTO</GlassBadge>}>Whale Scanner</SectionLabel>
        <Glass radius={22} padding={16} className="space-y-2">
          <div className="text-subtle" style={{ fontSize: 12, marginBottom: 8 }}>
            Discover profitable wallets from STON.fi + TonAPI. Runs automatically every 24h.
          </div>
          {scanResult && (
            <Glass radius={14} padding={12} className="space-y-1">
              {scanResult.whales ? (
                <>
                  <div className="text-fg font-mono" style={{ fontSize: 12, fontWeight: 600 }}>
                    Dry run — {scanResult.whales.length} whales found
                  </div>
                  {scanResult.whales.slice(0, 4).map(w => (
                    <div key={w.address} className="text-subtle font-mono" style={{ fontSize: 11 }}>
                      {w.nickname} · score {w.score.toFixed(2)} · {formatUsd(w.volumeUsd30d)}
                    </div>
                  ))}
                  {scanResult.whales.length > 4 && (
                    <div className="text-subtle" style={{ fontSize: 11 }}>…and {scanResult.whales.length - 4} more</div>
                  )}
                </>
              ) : (
                <>
                  <div className="text-fg" style={{ fontSize: 12, fontWeight: 600 }}>
                    +{scanResult.result.discovered} new · {scanResult.result.updated} updated
                  </div>
                  <div className="text-subtle" style={{ fontSize: 11 }}>
                    Skipped: {scanResult.result.skipped} · {scanResult.result.durationMs}ms
                  </div>
                </>
              )}
            </Glass>
          )}
          <GlassButton variant="primary" fullWidth size="md" disabled={scanner.isPending}
            onClick={async () => {
              setScanResult(null);
              try {
                const r = await scanner.mutateAsync({ dryRun: false });
                setScanResult(r);
                showFeedback("success", `Scanner complete: +${r.result.discovered} new whales`);
              } catch (err) { showFeedback("error", String(err)); }
            }}>
            {scanner.isPending ? "Scanning…" : "Run scan now"}
          </GlassButton>
          <GlassButton variant="secondary" fullWidth size="md" disabled={scanner.isPending}
            onClick={async () => {
              setScanResult(null);
              try {
                const r = await scanner.mutateAsync({ dryRun: true });
                setScanResult(r);
              } catch (err) { showFeedback("error", String(err)); }
            }}>
            Dry-run preview
          </GlassButton>
        </Glass>

        {/* About */}
        <SectionLabel>About</SectionLabel>
        <Glass radius={22} padding={0} className="overflow-hidden">
          <SettingRow icon={<span style={{ fontSize: 14 }}>ℹ</span>} label="Version" right={<span className="text-subtle" style={{ fontSize: 12 }}>v0.9.4</span>} />
          <SettingRow icon={<span style={{ fontSize: 14 }}>⚖</span>} label="Terms of Service" last={false} onClick={() => {}} />
          <SettingRow icon={<span style={{ fontSize: 14 }}>🔒</span>} label="Privacy Policy" last={false} onClick={() => {}} />
          <SettingRow
            icon={<span style={{ fontSize: 14 }}>◎</span>}
            label="Show onboarding again"
            last
            control={
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  localStorage.removeItem(ONBOARDED_KEY);
                  window.location.reload();
                }}
              >
                Show
              </GlassButton>
            }
          />
        </Glass>

        <div className="text-center text-subtle pt-2 pb-4" style={{ fontSize: 11 }}>
          TonMirror v0.9.4 · build α
        </div>
      </div>
    </div>
  );
}
