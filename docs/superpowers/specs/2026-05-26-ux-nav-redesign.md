# UX & Navigation Redesign — Implementation Spec

> **For agentic workers:** Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement task-by-task.

**Goal:** Restructure navigation from 5 to 4 tabs (merge Leaders+Activity→Market, rename Vault→Portfolio), add wallet balance to Portfolio, implement onboarding (welcome screens + spotlight tour), add Bottom Sheet for leader cards and inline expand for activity events, fix dark-mode tab bar inactive color.

**Architecture:** Pure UI/UX layer — no backend changes. New `/market` route replaces `/leaders` and `/activity`. Portfolio gains a `useTonBalance` hook that fetches from tonapi.io when wallet+API key are available and falls back to trade-history approximation. Onboarding state lives in localStorage. BottomSheet is a new shared primitive.

**Tech Stack:** Next.js 15 App Router, React, TanStack Query, TON Connect, Tailwind CSS, Liquid Glass + Terminal dual-theme system.

---

## File Map

### New files
| File | Purpose |
|---|---|
| `app/(tabs)/market/page.tsx` | Merged Market page — Leaders + Activity with internal tab switcher |
| `components/ui/BottomSheet.tsx` | Reusable slide-up panel primitive (glass + terminal variants) |
| `components/onboarding/WelcomeScreens.tsx` | 3-card swipeable welcome flow |
| `components/onboarding/SpotlightTour.tsx` | 5-step overlay tour with clip-path highlight |
| `components/onboarding/OnboardingManager.tsx` | Orchestrator — reads localStorage, renders Welcome then Spotlight |
| `hooks/useTonBalance.ts` | Fetches TON balance from tonapi.io; falls back to trade approximation |

### Modified files
| File | Change |
|---|---|
| `app/(tabs)/layout.tsx` | Add `<OnboardingManager />` inside glass branch; fix dark-mode inactive tab color |
| `app/(tabs)/portfolio/page.tsx` | Add wallet balance hero section using `useTonBalance` |
| `app/(tabs)/leaders/page.tsx` | Add `redirect('/market')` at top |
| `app/(tabs)/activity/page.tsx` | Add `redirect('/market?tab=activity')` at top |
| `components/glass/GlassTabBar.tsx` | 5→4 tabs (Mirror, Market, Portfolio, Settings); fix inactive color in dark mode |
| `components/terminal/TermTabBar.tsx` | 5→4 tabs to match |
| `app/(tabs)/settings/page.tsx` | Add "Show onboarding again" button |

### Deleted files
None — old pages redirect rather than being removed (safe for deep links).

---

## Section 1: Tab Bar Color Fix (Dark Mode)

**Problem:** Inactive tab text uses `rgb(var(--text3))` = `120 120 132` on near-black background → contrast ratio ~2.5:1, illegible.

**Fix in `GlassTabBar.tsx`:**
```tsx
const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgb(var(--text3))";
```

`rgba(255,255,255,0.55)` on `#0c0c10` background = contrast ratio ~5.5:1 (WCAG AA pass).

---

## Section 2: Navigation Restructure

### 2a. New tab order (4 tabs)

| Tab | Icon | Route | Label |
|---|---|---|---|
| Mirror | dual-circle | `/home` | Mirror |
| Market | chart-bar | `/market` | Market |
| Portfolio | wallet | `/portfolio` | Portfolio |
| Settings | gear | `/settings` | Settings |

`GlassTabBar` and `TermTabBar` both updated to 4 tabs.

### 2b. Market page (`app/(tabs)/market/page.tsx`)

Internal state: `const [activeTab, setActiveTab] = useState<'leaders'|'activity'>('leaders')`

URL param support: on mount, reads `?tab=activity` to initialize from redirect.

**Glass layout:**
```
<PageTitle title="Market" />
<PillSwitcher tabs={['Leaders','Activity']} active={activeTab} onChange={setActiveTab} />
{activeTab === 'leaders' ? <LeadersList /> : <ActivityFeed />}
```

`PillSwitcher` — two rounded-full glass buttons side by side. Active = `background: rgb(var(--text1))`, `color: rgb(var(--bg))`. Inactive = `var(--glass-hi)`.

`LeadersList` — extract existing leaders list JSX from `app/(tabs)/leaders/page.tsx` glass branch into this component. Leader card taps open `LeaderBottomSheet` (see Section 3).

`ActivityFeed` — extract existing activity list JSX from `app/(tabs)/activity/page.tsx` glass branch. Event taps toggle inline expansion.

**Terminal layout:** Same pill switcher in terminal style (`tm-mono border border-phos`), feeds terminal branches of each list.

### 2c. Redirects

`app/(tabs)/leaders/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
export default function LeadersPage() { redirect('/market'); }
```

`app/(tabs)/activity/page.tsx`:
```tsx
import { redirect } from 'next/navigation';
export default function ActivityPage() { redirect('/market?tab=activity'); }
```

---

## Section 3: Portfolio — Wallet Balance

### 3a. `hooks/useTonBalance.ts`

```ts
export interface TonBalanceResult {
  tonRaw: bigint | null;        // nanotons
  tonFormatted: string | null;  // "12.45 TON"
  usdFormatted: string | null;  // "≈ $36.20"
  source: 'live' | 'approx' | 'none';
  isLoading: boolean;
}

export function useTonBalance(): TonBalanceResult
```

**Logic:**
1. If `!isConnected` → return `{ source: 'none', isLoading: false, ... nulls }`
2. If `TON_API_KEY` env present → `useQuery` fetching `GET https://tonapi.io/v2/accounts/{address}`, extract `balance` (nanotons) + `balance_usd`
3. On error or no key → approximate from `useActivity` sum of `usdEstimate` for accepted decisions (labeled `source: 'approx'`)

TanStack Query key: `['ton-balance', address]`. `staleTime: 30_000`, `refetchInterval: 60_000`.

### 3b. Portfolio page balance section (glass branch)

Insert at top, before existing content:

```tsx
// Wallet not connected
if (!isConnected) {
  <Glass hi className="p-4 mb-4">
    <p className="text-muted text-sm">Connect your wallet to see balance</p>
    <Button onClick={connect} size="sm" className="mt-2">Connect Wallet</Button>
  </Glass>
}

// Connected
<Glass hi className="p-4 mb-4">
  <div className="text-xs text-subtle uppercase tracking-wider mb-1">Wallet Balance</div>
  {balanceLoading ? <Skeleton className="h-8 w-40" /> : (
    <>
      <div className="text-2xl font-semibold text-fg">{tonFormatted ?? '—'}</div>
      <div className="text-sm text-muted">{usdFormatted ?? ''}</div>
      {source === 'approx' && (
        <div className="text-xs text-subtle mt-1">* Approximate from copied trades</div>
      )}
    </>
  )}
</Glass>
```

---

## Section 4: BottomSheet Primitive

### `components/ui/BottomSheet.tsx`

```tsx
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Sheet height as % of screen, default 65 */
  heightPercent?: number;
}
```

**Implementation:**
- Fixed position, `bottom-0 left-0 right-0`, `z-[200]`
- Backdrop: `fixed inset-0 bg-black/40 z-[199]`, tap closes
- Sheet container: `transform: translateY(${isOpen ? 0 : 100}%)`, `transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1)`
- Drag handle: `w-9 h-1 rounded-full bg-hair/20 mx-auto mb-3`
- Touch drag-to-dismiss: `onTouchStart`/`onTouchMove`/`onTouchEnd` — if drag delta > 80px → `onClose()`

**Glass variant (default):**
```tsx
background: "var(--glass-hi)"
backdropFilter: "blur(40px) saturate(180%)"
borderTop: "0.5px solid var(--glass-edge)"
borderRadius: "24px 24px 0 0"
```

**Terminal variant (`theme === 'terminal'`):**
```tsx
background: "#000"
borderTop: "1px solid rgba(0,255,102,0.35)"
borderLeft / borderRight: same
borderRadius: 0
```

---

## Section 5: Leader Bottom Sheet (`LeaderBottomSheet`)

Lives inline in `app/(tabs)/market/page.tsx` or extracted to `components/leaders/LeaderBottomSheet.tsx`.

```tsx
interface LeaderBottomSheetProps {
  leaderId: string | null;  // null = closed
  onClose: () => void;
}
```

**Content (glass):**
```
[Avatar]  Nickname
          UQ…ab12  ·  [RiskBadge]

┌──────────┬──────────┬──────────┐
│  +42.1%  │   128    │  94.0%   │
│  30d PnL │  Trades  │ Win Rate │
└──────────┴──────────┴──────────┘

[Sparkline — 7 data points, last 7 days]

[  ✓ Following  ]  or  [  + Follow  ]
[  Open full profile →            ]
```

Follow button calls `useCreateStrategy` / `useDeleteStrategy`.
"Open full profile" = `<Link href={/leaders/${leaderId}}>` → closes sheet + navigates.

**Data source:** `useLeader(leaderId)` — existing hook or direct from leaders list data (passed as prop to avoid double-fetch).

---

## Section 6: Activity Inline Expand

In `ActivityFeed` component, each event row:

```tsx
const [expandedId, setExpandedId] = useState<string | null>(null);

// On tap:
onClick={() => setExpandedId(id === expandedId ? null : id)}

// Expanded area (CSS max-height transition 0→auto via max-height trick):
{expanded && (
  <div className="mt-2 pt-2 border-t border-glass-edge space-y-1 text-sm">
    <div>Sold: {soldAmount} {soldToken}</div>
    <div>Bought: {boughtAmount} {boughtToken}</div>
    <div>DEX: {dex}</div>
    <DecisionBadge decision={outcome} />
    {outcome === 'manual_review' && pendingExecution && (
      <Button size="sm" onClick={openQuote}>Get Quote</Button>
    )}
  </div>
)}
```

---

## Section 7: Onboarding

### 7a. `WelcomeScreens.tsx`

3 cards, full-screen overlay (`fixed inset-0 z-[300]`), background `rgb(var(--bg))`.

**Card data:**
```ts
const SLIDES = [
  {
    icon: "◆",
    title: "Copy the best traders\non TON — automatically.",
    body: "TonMirror зеркалирует сделки топовых кошельков прямо в твой. Никакого трейдинга вручную.",
  },
  {
    icon: "👁",
    title: "Follow a Leader",
    body: "Изучи статистику, риск-скор и историю сделок. Один тап — и ты следишь за лидером.",
  },
  {
    icon: "⚡",
    title: "Auto or Manual",
    body: "Подтверждай каждую сделку вручную или дай стратегии работать автоматом.",
  },
];
```

Navigation: dot indicators + «Далее» / «Начать» button. «Пропустить» text-button top-right (all slides). Swipe left/right via `onTouchStart`/`onTouchEnd` delta detection (>50px).

On last slide «Начать» → `onComplete()` which starts spotlight tour.

### 7b. `SpotlightTour.tsx`

```tsx
interface TourStep {
  targetSelector: string;  // CSS selector for highlighted element
  title: string;
  body: string;
  placement: 'top' | 'bottom';
}
```

**Steps:**
```ts
const STEPS: TourStep[] = [
  { targetSelector: '[data-tour="tab-mirror"]',    title: "Live Feed",     body: "Все входящие сигналы от лидеров в реальном времени.", placement: 'top' },
  { targetSelector: '[data-tour="tab-market"]',    title: "Market",        body: "Лидеры и лента сделок в одном месте.", placement: 'top' },
  { targetSelector: '[data-tour="tab-portfolio"]', title: "Portfolio",     body: "Баланс кошелька, стратегии и PnL.", placement: 'top' },
  { targetSelector: '[data-tour="tab-settings"]',  title: "Settings",      body: "Тема, стратегия и демо-режим.", placement: 'top' },
  { targetSelector: '[data-tour="connect-wallet"]',title: "Connect Wallet",body: "Подключи кошелёк, чтобы начать копировать сделки.", placement: 'bottom' },
];
```

Each tab link in `GlassTabBar` and `TermTabBar` gets `data-tour="tab-{name}"` attribute.
Connect wallet button on home page gets `data-tour="connect-wallet"`.

**Overlay rendering:**
1. `getBoundingClientRect()` of target element
2. Full-screen dark overlay `bg-black/60`
3. Cut out target rect via `clip-path` with `polygon` (box-shaped hole)
4. Tooltip card positioned above/below target rect
5. Tap anywhere → next step; last step → `onComplete()`

### 7c. `OnboardingManager.tsx`

```tsx
export function OnboardingManager() {
  const [stage, setStage] = useState<'welcome' | 'tour' | 'done'>(() =>
    localStorage.getItem('tonmirror-onboarded') ? 'done' : 'welcome'
  );

  if (stage === 'done') return null;
  if (stage === 'welcome') return <WelcomeScreens onComplete={() => setStage('tour')} />;
  return <SpotlightTour onComplete={() => {
    localStorage.setItem('tonmirror-onboarded', '1');
    setStage('done');
  }} />;
}
```

Mounted in `app/(tabs)/layout.tsx` glass branch only (terminal users get no tour).

### 7d. Settings "Show Tour Again" button

In Settings page, under "About" section:
```tsx
<SettingRow
  icon="◎"
  label="Show onboarding again"
  control={
    <Button size="sm" variant="secondary" onClick={() => {
      localStorage.removeItem('tonmirror-onboarded');
      window.location.reload();
    }}>Show</Button>
  }
/>
```

---

## Error & Loading States

| Component | Loading | Error |
|---|---|---|
| `useTonBalance` loading | `<Skeleton className="h-8 w-40" />` | Show "Balance unavailable" in muted text |
| Market leaders list | 3× skeleton cards | "Failed to load leaders" + retry button |
| Market activity feed | 3× skeleton rows | "Failed to load activity" + retry button |
| LeaderBottomSheet | Skeleton for stats | Close sheet, navigate to full page |

---

## Dark Mode Inactive Tab Color (quick fix)

Already applied in previous session but incomplete. Final value:
```tsx
const inactiveColor = isDark ? "rgba(255,255,255,0.55)" : "rgb(var(--text3))";
```

This is applied in `GlassTabBar.tsx` for both the icon color and label.
