# UI Simplification + Deeper Omniston Usage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make TonMirror simpler to understand — a 3-tab role-based IA with non-duplicated screens, per-theme screen components instead of 500-line dual-UI pages, and Omniston surfaced through a central confirm-sheet, live TON/USD pricing, and route transparency.

**Architecture:** `page.tsx` files become thin: fetch via hooks, derive, then render a theme-specific presentational component (`components/screens/<screen>/{Glass,Terminal}<Screen>.tsx`). Navigation collapses from 4 tabs (Mirror/Market/Portfolio/Settings, with redirect stubs) to 3 (Mirror/Discover/Activity); Settings moves to a header gear; Portfolio merges into Activity. Omniston gains a `pricing.service` (live TON↔USDT with cache + fallback) and a `CopyConfirmSheet` that replaces the inline terminal-styled `QuoteCard`.

**Tech Stack:** Next.js App Router (client components), TanStack Query, Vitest, `@ston-fi/omniston-sdk`, TON Connect, Prisma.

**Branch:** `feat/ui-simplification-omniston` (already created; spec committed).

**Verification gates used in this plan:**
- Logic units (pricing service): real Vitest unit tests (TDD).
- UI refactors (presentational, hard to unit-test): the gate is `pnpm type-check` clean + `pnpm test` still 40/40 + visual parity check in browser. Each such task commits only when both pass.

---

## Phase 0 — Groundwork

### Task 0.1: Confirm clean baseline

**Files:** none (verification only)

- [ ] **Step 1: Type-check and test the current tree**

Run: `pnpm type-check && pnpm test`
Expected: `tsc` clean, Vitest `40/40 pass`. If not, stop and fix before continuing — every later task relies on this baseline.

- [ ] **Step 2: Note the deleted root PNGs**

The branch already removed the committed root PNGs (repo hygiene). No action — just confirm `git status` shows no stray screenshot files.

---

## Phase 1 — Theme component extraction (no visual change)

Goal: split each dual-UI page into a thin `page.tsx` + two presentational components. **Visual output must be byte-for-byte identical** after each task — this phase only moves code. Do screens one at a time and verify parity before moving on.

The pattern for every screen:
1. Create `components/screens/<screen>/Glass<Screen>.tsx` and `Terminal<Screen>.tsx`.
2. Move the existing JSX for each branch into the matching component, exposing the data/handlers it used as a typed props interface.
3. Reduce `page.tsx` to: hooks + derived values + `theme === "terminal" ? <Terminal.../> : <Glass.../>`.

### Task 1.1: Define the shared screen-props convention

**Files:**
- Create: `components/screens/README.md`

- [ ] **Step 1: Write the convention doc**

```markdown
# Screen components

Presentational, theme-specific screen bodies. Rules:

- Receive ALL data and callbacks via a typed `Props` interface. No data fetching,
  no `useQuery`/`useMutation` here — that lives in the route `page.tsx`.
- One file per (screen, theme): `Glass<Screen>.tsx`, `Terminal<Screen>.tsx`.
- `page.tsx` is the only place that calls hooks, derives values, and switches theme.
- Local UI state (expanded row, open sheet) MAY live in the screen component.
```

- [ ] **Step 2: Commit**

```bash
git add components/screens/README.md
git commit -m "docs: screen-component convention for theme split"
```

### Task 1.2: Extract Home screen components

**Files:**
- Create: `components/screens/home/GlassHome.tsx`
- Create: `components/screens/home/TerminalHome.tsx`
- Modify: `app/(tabs)/home/page.tsx`

- [ ] **Step 1: Create `GlassHome.tsx`**

Move the entire Glass branch JSX (currently `app/(tabs)/home/page.tsx:182-362`) into a component with this signature. Copy the JSX verbatim; replace the locally-computed values with props.

```tsx
"use client";
import Link from "next/link";
import { Glass } from "@/components/glass/Glass";
import { PageTitle } from "@/components/glass/PageTitle";
import { SectionLabel } from "@/components/glass/SectionLabel";
import { Avatar, prettyName } from "@/components/glass/Avatar";
import { StatCell } from "@/components/glass/Stat";
import { Skeleton as GlassSkeleton } from "@/components/ui/Skeleton";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { formatUsd, formatRelativeTime, formatAmount } from "@/lib/format";
import type { StrategyDto } from "@/hooks/useStrategies";
import type { ActivityEvent } from "@/hooks/useActivity";

export interface HomeViewProps {
  strategies: StrategyDto[] | undefined;
  activity: ActivityEvent[] | undefined;
  stratLoading: boolean;
  actLoading: boolean;
  wallet: { isConnected: boolean; isRestored: boolean; shortAddress: string | null };
  activeCount: number;
  copiedToday: number;
  totalVolume: number;
}

export function GlassHome(props: HomeViewProps) {
  const { strategies, activity, stratLoading, actLoading, wallet, activeCount, copiedToday, totalVolume } = props;
  // ← paste the existing Glass JSX (page.tsx:182-362) here, unchanged
}
```

(Use the actual exported member name from `hooks/useStrategies.ts` for `StrategyDto`; if the hook does not export a row type, add `export type StrategyDto = NonNullable<ReturnType<typeof useStrategies>["data"]>[number];` to that hook file in this step.)

- [ ] **Step 2: Create `TerminalHome.tsx`**

Move the Terminal branch JSX (`page.tsx:57-178`, including the `BOOT_LOG` constant) into `TerminalHome(props: HomeViewProps)`, same props interface.

- [ ] **Step 3: Slim `page.tsx`**

```tsx
"use client";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassHome } from "@/components/screens/home/GlassHome";
import { TerminalHome } from "@/components/screens/home/TerminalHome";
import { useStrategies } from "@/hooks/useStrategies";
import { useActivity } from "@/hooks/useActivity";
import { useWallet } from "@/hooks/useWallet";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function HomePage() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const { data: strategies, isLoading: stratLoading } = useStrategies(userId ?? undefined);
  const { data: activity, isLoading: actLoading } = useActivity({ limit: 10 });
  const wallet = useWallet();

  const activeCount = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday = activity?.filter(
    (e) => e.decision?.outcome === "accepted" &&
      new Date(e.timestamp).toDateString() === new Date().toDateString(),
  ).length ?? 0;
  const totalVolume = activity?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;

  const view = {
    strategies, activity, stratLoading, actLoading,
    wallet: { isConnected: wallet.isConnected, isRestored: wallet.isRestored, shortAddress: wallet.shortAddress },
    activeCount, copiedToday, totalVolume,
  };
  return theme === "terminal" ? <TerminalHome {...view} /> : <GlassHome {...view} />;
}
```

- [ ] **Step 4: Verify parity**

Run: `pnpm type-check && pnpm test`
Expected: `tsc` clean, `40/40 pass`.
Then `pnpm dev`, open `/home` in Glass, Glass-dark, and Terminal themes — confirm each looks identical to before.

- [ ] **Step 5: Commit**

```bash
git add components/screens/home app/\(tabs\)/home/page.tsx hooks/useStrategies.ts
git commit -m "refactor: split Home into per-theme screen components"
```

### Task 1.3: Extract Market screen components

**Files:**
- Create: `components/screens/market/GlassMarket.tsx`
- Create: `components/screens/market/TerminalMarket.tsx`
- Modify: `app/(tabs)/market/page.tsx`

- [ ] **Step 1: Move row/sheet helpers**

Move `TermEventRow`, `GlassEventRow`, `ExecStatusGlyph`, `decTag`, `decoFor`, `LeaderSheetContent`, and the filter-map constants out of `page.tsx` into the matching theme component file (terminal helpers → `TerminalMarket.tsx`, glass helpers → `GlassMarket.tsx`). Shared types (`MarketTab`) go into the component that needs them or a local `types.ts`.

- [ ] **Step 2: Create `GlassMarket.tsx` and `TerminalMarket.tsx`**

Each exposes:

```tsx
export interface MarketViewProps {
  leaders: Leader[] | undefined;
  events: ActivityEvent[] | undefined;
  lLoad: boolean; lError: boolean;
  eLoad: boolean; eError: boolean;
  activeTab: "leaders" | "activity";
  setActiveTab: (t: "leaders" | "activity") => void;
}
```

Paste the corresponding branch JSX (`page.tsx:310-420` terminal, `page.tsx:430-564` glass) verbatim, wired to props. Keep the `BottomSheet`/`selectedLeader` state local to `GlassMarket`.

> Note: the `activeTab`/`selectedLeader`/filter state currently lives in `MarketPageInner`. Keep `activeTab` + URL sync in `page.tsx` (it reads `useSearchParams`); pass `activeTab`/`setActiveTab` down. Filter chips state (`termFilter`/`glassFilter`) is theme-local — move it into the theme component.

- [ ] **Step 3: Slim `page.tsx`** to the `Suspense` wrapper + `MarketPageInner` that does hooks, URL-driven `activeTab`, and `theme === "terminal" ? <TerminalMarket/> : <GlassMarket/>`.

- [ ] **Step 4: Verify parity**

Run: `pnpm type-check && pnpm test`
Expected: clean + `40/40`. Visually verify `/market` Leaders and Activity sub-tabs in all three themes, including opening a quote and the leader bottom sheet.

- [ ] **Step 5: Commit**

```bash
git add components/screens/market app/\(tabs\)/market/page.tsx
git commit -m "refactor: split Market into per-theme screen components"
```

### Task 1.4: Extract Portfolio and Settings screen components

**Files:**
- Create: `components/screens/portfolio/{GlassPortfolio,TerminalPortfolio}.tsx`
- Create: `components/screens/settings/{GlassSettings,TerminalSettings}.tsx`
- Modify: `app/(tabs)/portfolio/page.tsx`, `app/(tabs)/settings/page.tsx`

- [ ] **Step 1:** Apply the same extraction pattern to `portfolio/page.tsx` (369 lines) and `settings/page.tsx` (561 lines). Define a `PortfolioViewProps` / `SettingsViewProps` from the values each branch consumes; move row helpers (`TermStrategyRow`, etc.) into the terminal/glass files.

- [ ] **Step 2: Verify parity**

Run: `pnpm type-check && pnpm test`
Expected: clean + `40/40`. Visually verify `/portfolio` and `/settings` in all themes (including the demo control panel in Settings).

- [ ] **Step 3: Commit**

```bash
git add components/screens/portfolio components/screens/settings app/\(tabs\)/portfolio/page.tsx app/\(tabs\)/settings/page.tsx
git commit -m "refactor: split Portfolio and Settings into per-theme screen components"
```

---

## Phase 2 — 3-tab role-based IA

Now that screens are componentised, restructure navigation. Behaviour changes here; verify each step in the browser.

### Task 2.1: Reduce the tab bar to 3 tabs + header gear

**Files:**
- Modify: `components/glass/GlassTabBar.tsx`
- Modify: `components/terminal/TermTabBar.tsx`
- Modify: `components/glass/PageTitle.tsx` (add a default gear in the `right` slot when none passed) OR pass a gear from each Glass screen header.

- [ ] **Step 1: Edit `GlassTabBar.tsx` `TABS`**

Replace the 4-entry `TABS` array with 3 entries: Mirror (`/home`), Discover (`/market`, label `"Discover"`, reuse the market icon), Activity (`/activity`, reuse a feed icon — copy the portfolio/market icon SVG and relabel). Remove the Settings and Portfolio tab entries.

- [ ] **Step 2: Edit `TermTabBar.tsx`** the same way (Mirror / DISCOVER / ACTIVITY). Open the file first to match its existing entry shape.

- [ ] **Step 3: Add the Settings gear to headers**

In `GlassHome`/`GlassMarket`/`GlassActivity` `PageTitle`, set `right={<Link href="/settings"> <gear svg/> </Link>}` (reuse the gear SVG from `GlassTabBar`'s old settings entry). For Terminal, add a small `⚙` link in `TermHeader` usages. Settings stays reachable, just not a bottom tab.

- [ ] **Step 4: Verify**

Run: `pnpm type-check`
Then `pnpm dev`: tab bar shows 3 tabs in all themes; the gear opens `/settings`; active-state highlighting works for `/home`, `/market`, `/activity`.

- [ ] **Step 5: Commit**

```bash
git add components/glass/GlassTabBar.tsx components/terminal/TermTabBar.tsx components/screens components/glass/PageTitle.tsx
git commit -m "feat: 3-tab nav (Mirror/Discover/Activity) + settings gear in header"
```

### Task 2.2: Make `/activity` a real merged page (Activity + Portfolio)

**Files:**
- Create: `components/screens/activity/{GlassActivity,TerminalActivity}.tsx`
- Modify: `app/(tabs)/activity/page.tsx` (currently a redirect — replace it)
- Modify: `app/(tabs)/portfolio/page.tsx` (turn into a redirect)

- [ ] **Step 1: Build `GlassActivity` / `TerminalActivity`**

Compose from existing pieces: at the top, the PnL/strategies summary lifted from `GlassPortfolio`/`TerminalPortfolio` (StatCell triad + active-strategy compact rows); below it, the activity feed + filter chips lifted from `GlassMarket`/`TerminalMarket`'s Activity branch (`GlassEventRow`/`TermEventRow`). Reuse those row components — do not duplicate them; move them to `components/activity/` if they need to be shared between Market (now Discover) and Activity.

Props:

```tsx
export interface ActivityViewProps {
  events: ActivityEvent[] | undefined;
  strategies: StrategyDto[] | undefined;
  eLoad: boolean; eError: boolean; stratLoading: boolean;
  filter: string; setFilter: (f: string) => void;
  activeCount: number; copiedToday: number; totalVolume: number;
}
```

- [ ] **Step 2: Replace `activity/page.tsx`**

```tsx
"use client";
import { Suspense } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import { GlassActivity } from "@/components/screens/activity/GlassActivity";
import { TerminalActivity } from "@/components/screens/activity/TerminalActivity";
import { useActivity } from "@/hooks/useActivity";
import { useStrategies } from "@/hooks/useStrategies";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useState } from "react";

function ActivityInner() {
  const { theme } = useTheme();
  const { userId } = useCurrentUser();
  const { data: events, isLoading: eLoad, isError: eError } = useActivity({ limit: 50 });
  const { data: strategies, isLoading: stratLoading } = useStrategies(userId ?? undefined);
  const [filter, setFilter] = useState<string>("All");
  const activeCount = strategies?.filter((s) => !s.isPaused).length ?? 0;
  const copiedToday = events?.filter((e) => e.decision?.outcome === "accepted" &&
    new Date(e.timestamp).toDateString() === new Date().toDateString()).length ?? 0;
  const totalVolume = events?.reduce((s, e) => s + (e.usdEstimate ?? 0), 0) ?? 0;
  const v = { events, strategies, eLoad, eError, stratLoading, filter, setFilter, activeCount, copiedToday, totalVolume };
  return theme === "terminal" ? <TerminalActivity {...v} /> : <GlassActivity {...v} />;
}

export default function ActivityPage() {
  return <Suspense fallback={null}><ActivityInner /></Suspense>;
}
```

- [ ] **Step 3: Turn Portfolio into a redirect**

Replace `app/(tabs)/portfolio/page.tsx` with:

```tsx
import { redirect } from "next/navigation";
export default function PortfolioPage() {
  redirect("/activity");
}
```

(The Portfolio screen components remain for now as the source the Activity summary was lifted from; delete them in Task 2.4 cleanup once Activity is confirmed to cover everything.)

- [ ] **Step 4: Remove the Activity sub-tab from Discover**

In `GlassMarket`/`TerminalMarket`, delete the `leaders | activity` sub-tab switcher and the entire `activity` branch (it now lives in `/activity`). Discover renders the leaders list only. Update `MarketViewProps` to drop `events/eLoad/eError/activeTab/setActiveTab`. Simplify `market/page.tsx` accordingly (drop `useActivity`, URL `tab` sync).

- [ ] **Step 5: Verify**

Run: `pnpm type-check && pnpm test`
Expected: clean + `40/40`. Browser: `/activity` shows summary + feed + filters; `/portfolio` redirects to `/activity`; `/market` (Discover) shows leaders only, no Activity sub-tab; opening a quote from an Activity row still works.

- [ ] **Step 6: Commit**

```bash
git add components/screens app/\(tabs\)/activity/page.tsx app/\(tabs\)/portfolio/page.tsx components/activity
git commit -m "feat: merge Portfolio into a real /activity page; Discover is leaders-only"
```

### Task 2.3: Slim the Mirror (Home) screen

**Files:**
- Modify: `components/screens/home/GlassHome.tsx`
- Modify: `components/screens/home/TerminalHome.tsx`

- [ ] **Step 1: Remove duplicated blocks**

In both Home components, delete the full "Recent activity" / "LEADERS · TAPE" feed block and the long following-leaders list. Keep: hero (balance + wallet status), a compact "Mirroring now" list capped at 3 strategies, and the "Discover leaders" CTA. The full feed now lives in `/activity`; full leader browsing in `/market`.

- [ ] **Step 2: Add the "Needs your attention" block (data only this task)**

Add a section that lists executions needing confirmation. Derive from existing `activity` data already passed to Home: pending = events where `execution.status` is `"pending"` or `"quoted"` and `decision.outcome !== "rejected"`. Render each as a tappable row; the tap handler is wired to the confirm-sheet in Phase 4 (for now `onClick` is a no-op prop `onConfirm(event)` defaulting to opening the existing QuoteCard inline, to keep the screen functional between phases).

Update `HomeViewProps` to include `onConfirm?: (event: ActivityEvent) => void`.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm test`
Expected: clean + `40/40`. Browser: Mirror shows hero + needs-attention + compact mirroring + CTA only; no full feed, no long leader list, in all three themes.

- [ ] **Step 4: Commit**

```bash
git add components/screens/home
git commit -m "feat: slim Mirror to command-center (hero + needs-attention + compact mirroring)"
```

### Task 2.4: Wire redirects and clean up dead screens

**Files:**
- Verify: `app/(tabs)/leaders/page.tsx` (already redirects to `/market` — keep)
- Delete: `components/screens/portfolio/*` (only after confirming Activity covers it)

- [ ] **Step 1:** Confirm `/leaders` → `/market` redirect still valid (Discover lives at `/market`). Leave as-is.

- [ ] **Step 2:** Delete the now-unused Portfolio screen components if every datum they showed is present in `/activity`. If anything is missing, port it into `GlassActivity`/`TerminalActivity` first.

Run: `pnpm type-check && pnpm test` → clean + `40/40`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove dead Portfolio screen components after Activity merge"
```

---

## Phase 3 — Omniston live pricing (TON/USD) with cache + fallback

### Task 3.1: `pricing.service` — failing test first

**Files:**
- Create: `tests/unit/pricing-service.test.ts`
- Create: `server/services/pricing.service.ts` (next task)

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTonUsd, __resetPricingCacheForTests } from "@/server/services/pricing.service";

describe("pricing.service getTonUsd", () => {
  beforeEach(() => __resetPricingCacheForTests());

  it("returns the fallback (3) when live source is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "false");
    expect(await getTonUsd()).toBe(3);
  });

  it("returns the quote-derived rate when live and provider succeeds", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 5.5 }) };
    expect(await getTonUsd({ provider })).toBe(5.5);
    expect(provider.getQuote).toHaveBeenCalledOnce();
  });

  it("falls back to 3 when the live provider throws", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockRejectedValue(new Error("ws down")) };
    expect(await getTonUsd({ provider })).toBe(3);
  });

  it("caches within the window — second call does not hit the provider", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_LIVE_SOURCE", "true");
    const provider = { getQuote: vi.fn().mockResolvedValue({ rate: 4.2 }) };
    await getTonUsd({ provider });
    await getTonUsd({ provider });
    expect(provider.getQuote).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm test tests/unit/pricing-service.test.ts`
Expected: FAIL — cannot find module `pricing.service`.

### Task 3.2: Implement `pricing.service`

**Files:**
- Create: `server/services/pricing.service.ts`

- [ ] **Step 1: Implement**

```ts
/**
 * Resolves a TON→USD rate via the Omniston quote provider when live, with an
 * in-memory cache window and a safe fallback. Never throws into the caller.
 */
import { getQuoteProvider } from "@/modules/omniston";
import type { QuoteProvider } from "@/modules/omniston/types";

const FALLBACK_TON_USD = 3;
const CACHE_WINDOW_MS = 60_000;
const PROBE_AMOUNT_TON = 1;

let cache: { value: number; at: number } | null = null;

export function __resetPricingCacheForTests() { cache = null; }

export async function getTonUsd(opts?: { provider?: QuoteProvider }): Promise<number> {
  if (process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE !== "true") return FALLBACK_TON_USD;
  if (cache && Date.now() - cache.at < CACHE_WINDOW_MS) return cache.value;
  try {
    const provider = opts?.provider ?? (await getQuoteProvider());
    const quote = await provider.getQuote({
      soldToken: "TON", boughtToken: "USDT",
      amountInDecimal: PROBE_AMOUNT_TON, slippageBps: 100,
    });
    const rate = quote.rate > 0 ? quote.rate : FALLBACK_TON_USD;
    cache = { value: rate, at: Date.now() };
    return rate;
  } catch {
    return cache?.value ?? FALLBACK_TON_USD;
  }
}
```

- [ ] **Step 2: Run the tests to verify they pass**

Run: `pnpm test tests/unit/pricing-service.test.ts`
Expected: PASS (4/4).

- [ ] **Step 3: Run the full suite**

Run: `pnpm test`
Expected: `44/44 pass` (40 prior + 4 new).

- [ ] **Step 4: Commit**

```bash
git add server/services/pricing.service.ts tests/unit/pricing-service.test.ts
git commit -m "feat: pricing.service — live TON/USD via Omniston with cache + fallback"
```

### Task 3.3: Use live pricing for USD estimates

**Files:**
- Modify: `modules/trade-ingestion/ton-payload-parser.ts:112-115` (replace `TON_USD_APPROX = 6`)
- Modify: `server/services/ingestion.service.ts` (the new poll path — inject the rate)

- [ ] **Step 1: Thread the rate into ingestion**

In `ingestion.service.ts`, before processing a batch, call `const tonUsd = await getTonUsd();` and pass it to the parser/normalizer that currently uses the hardcoded approximation, so `usdEstimate` reflects the live (or fallback) rate. Keep `ton-webhook-source.ts`'s own `getTonUsdRate` as-is (it already has a cache+fallback) OR refactor it to call `getTonUsd` — prefer the latter to remove duplication: replace the body of `getTonUsdRate` usage sites with `getTonUsd()` and delete the local `TON_USD_FALLBACK` constant.

> Concrete edit for the parser: change `const TON_USD_APPROX = 6;` to accept a parameter — give the parsing function an optional `tonUsd: number = 3` argument and use it instead of the literal. Callers pass `await getTonUsd()`.

- [ ] **Step 2: Verify**

Run: `pnpm type-check && pnpm test`
Expected: clean + `44/44`. (If any existing test asserted on the literal `6`/`3`, update it to the injected value.)

- [ ] **Step 3: Commit**

```bash
git add modules/trade-ingestion server/services/ingestion.service.ts
git commit -m "feat: use live TON/USD pricing for trade USD estimates"
```

---

## Phase 4 — CopyConfirmSheet + route transparency

### Task 4.1: Build `CopyConfirmSheet` (theme-aware)

**Files:**
- Create: `components/activity/CopyConfirmSheet.tsx`

- [ ] **Step 1: Implement the sheet**

Wrap the existing `BottomSheet` and drive it with the existing `useExecutionFlow` (from `hooks/useExecution.ts`) and `useWallet`/`useWalletActions` — the same logic `QuoteCard` uses today. Reuse `QuoteCard`'s `QuoteDetails`/`PreparedView`/`SubmittedView` bodies, but render theme-appropriate chrome via `useTheme()` (terminal keeps the `phos`/`CornerBox` look; glass uses `Glass` surfaces). Surface `quote.routeSummary` + `quote.resolverName` as one line: `Best route · {routeSummary} via {resolverName}`.

```tsx
"use client";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { QuoteCard } from "@/components/activity/QuoteCard"; // reuse flow body
import type { ActivityEvent } from "@/hooks/useActivity";

export interface CopyConfirmSheetProps {
  event: ActivityEvent | null;
  onClose: () => void;
}

export function CopyConfirmSheet({ event, onClose }: CopyConfirmSheetProps) {
  const open = event !== null && event.execution !== null && event.decision !== null;
  return (
    <BottomSheet isOpen={open} onClose={onClose} heightPercent={70}>
      {open && event.execution && event.decision && (
        <div className="px-4 pb-4">
          <QuoteCard
            executionId={event.execution.id}
            soldToken={event.soldToken}
            boughtToken={event.boughtToken}
            plannedAmount={event.decision.plannedAmountDecimal ?? event.usdEstimate ?? 10}
            slippageBps={100}
            onDismiss={onClose}
          />
        </div>
      )}
    </BottomSheet>
  );
}
```

> Decision: rather than retire `QuoteCard` wholesale (risky — it owns the working TON Connect flow), wrap it. A later cleanup task themes the body; the entry-point change (sheet, not inline expand) is the user-visible win now.

- [ ] **Step 2: Verify it renders**

Run: `pnpm type-check`
Browser: temporarily mount it — confirm it opens, fetches a quote, and the route line shows.

- [ ] **Step 3: Commit**

```bash
git add components/activity/CopyConfirmSheet.tsx
git commit -m "feat: CopyConfirmSheet wrapping the execution flow in a bottom sheet"
```

### Task 4.2: Wire the sheet into Mirror and Activity (replace inline expand)

**Files:**
- Modify: `app/(tabs)/home/page.tsx` (provide `onConfirm` that opens the sheet)
- Modify: `components/screens/home/{GlassHome,TerminalHome}.tsx`
- Modify: `components/screens/activity/{GlassActivity,TerminalActivity}.tsx`
- Modify: `components/activity/` row components (replace inline `QuoteCard` toggle with an `onConfirm(event)` callback)

- [ ] **Step 1:** Lift a `confirmEvent` state into `home/page.tsx` and `activity/page.tsx`. Pass `onConfirm={(e) => setConfirmEvent(e)}` into the screen components; render `<CopyConfirmSheet event={confirmEvent} onClose={() => setConfirmEvent(null)} />` at the page level.

- [ ] **Step 2:** In the shared row components, replace the `showQuote`/`expanded`-inline-`QuoteCard` branch with a "Confirm copy" button that calls `props.onConfirm(event)`. The "Needs your attention" rows on Mirror call the same.

- [ ] **Step 3: Verify**

Run: `pnpm type-check && pnpm test`
Expected: clean + `44/44`. Browser: tapping a pending copy on Mirror opens the sheet; tapping a pending Activity row opens the sheet; the inline expand no longer renders the terminal-styled quote inside the glass feed. Full quote→confirm→sign path works in demo mode.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/home/page.tsx app/\(tabs\)/activity/page.tsx components/screens components/activity
git commit -m "feat: open CopyConfirmSheet from Mirror + Activity, retire inline quote expand"
```

---

## Phase 5 — Final verification

### Task 5.1: Full self-check

- [ ] **Step 1:** Run `pnpm type-check` → clean.
- [ ] **Step 2:** Run `pnpm test` → all pass (expected 44/44).
- [ ] **Step 3:** Run `pnpm build` → succeeds.
- [ ] **Step 4:** Browser smoke in all three themes: Mirror (hero + needs-attention + compact mirroring + CTA), Discover (leaders only), Activity (summary + feed + filters + confirm sheet), Settings via gear (demo panel works). Confirm no screen shows a blank/error without a graceful state and that demo mode needs no live infra.
- [ ] **Step 5:** Run `code-review` skill against the branch (architecture, serverless-safety, idempotency, demo/live correctness).

### Task 5.2: Finish the branch

- [ ] Use `superpowers:finishing-a-development-branch` to decide merge/PR.

---

## Self-Review

**Spec coverage:**
- §1 Theme refactor → Phase 1 (Tasks 1.1–1.4). ✓
- §2 IA 3 tabs / Mirror / Discover / Activity / settings gear / portfolio redirect → Phase 2 (2.1–2.4). ✓
- §3a CopyConfirmSheet → Phase 4 (4.1–4.2). ✓
- §3b Live prices/PnL → Phase 3 (3.1–3.3). ✓
- §3c Route transparency → Task 4.1 Step 1 (route line). ✓
- §4 Demo-first/flags → enforced in pricing fallback (3.2), demo verification (5.1 Step 4). ✓
- §5 Out of scope (TON DNS, manual swap) → not implemented. ✓

**Placeholder scan:** UI-extraction steps say "paste existing JSX from <exact line range>" rather than reproducing hundreds of lines — this is a deliberate move-not-rewrite instruction with exact source coordinates, not a vague placeholder. Logic units (pricing) have full code. No "TBD"/"add error handling" placeholders.

**Type consistency:** `HomeViewProps`, `MarketViewProps`, `ActivityViewProps`, `CopyConfirmSheetProps`, `getTonUsd`, `__resetPricingCacheForTests` are used consistently across tasks. `StrategyDto` is defined in Task 1.2 Step 1 and reused. `getTonUsd({ provider })` signature matches between test (3.1) and impl (3.2).

**Known risk:** test counts assume the 4 new pricing tests are the only additions; if Phase 3.3 edits change an existing test's expected value, the total stays 44 but a prior test is modified (called out in 3.3 Step 2).
