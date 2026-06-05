# Design: UI simplification + deeper Omniston usage

Date: 2026-06-05
Status: Approved (TON DNS explicitly deferred)

## Problem

The app is hard to parse. The user's stated pains (in priority order):

1. **Too much data at once** — screens stack balance, stats, leaders, and the full
   activity feed together with no clear hierarchy.
2. **Unclear flow** — the path *find leader → follow → see the copy → confirm the
   swap* is buried; the confirm step hides behind a "GET QUOTE" button inside
   expandable activity rows.
3. **Blurry navigation** — Home, Market, Activity, and Portfolio duplicate each
   other. `/leaders` and `/activity` are just redirects into `/market`; "following
   leaders" shows on both Mirror and Portfolio; the activity feed shows on both
   Mirror and Market.

Secondary: Omniston is used at ~20% of its capability (quotes only) and that usage
is hidden. `ROUGH_TON_USD = 3` hardcodes USD estimates.

Explicitly **not** a pain: visual noise / decorative fx. The Glass and Terminal
aesthetics stay. Both themes are kept.

## Decisions (from brainstorming)

- **Themes:** keep both (Glass + Terminal), but extract each theme's screen markup
  into its own presentational component so page files stop being ~500 lines with two
  full UIs interleaved.
- **Information architecture:** role-based **3 tabs** (option A).
- **Omniston:** central confirm-sheet, live prices/PnL, route transparency.
  (Manual swap is out of scope.)
- **TON DNS:** deferred — do nothing this round.

## 1. Theme refactor (code only, no visual change)

Each tab's `page.tsx` becomes thin: it fetches data via existing hooks, computes
derived values, then selects a theme component and passes data down as props.

```
home/page.tsx
  → useStrategies / useActivity / useWallet (+ derive)
  → theme === "terminal" ? <TerminalHome {...props}/> : <GlassHome {...props}/>
```

Theme markup moves to colocated presentational components:

```
components/screens/home/{GlassHome,TerminalHome}.tsx
components/screens/discover/{GlassDiscover,TerminalDiscover}.tsx
components/screens/activity/{GlassActivity,TerminalActivity}.tsx
```

These components are presentational: data in via props, callbacks out. This matches
the existing convention (`app/` = composition, `components/` = presentational). No
behavioural change beyond what sections 2–3 specify.

## 2. Navigation — 3 role-based tabs

Tab bar: **Mirror · Discover · Activity**. Settings moves to a gear icon in the
screen header (Glass `PageTitle` right slot / Terminal `TermHeader`), not a tab.

Routing:
- `/home` — Mirror.
- `/market` — Discover (relabelled "Discover"; the Leaders|Activity sub-tabs are
  removed — Discover is leaders-only).
- `/activity` — now a **real page** (no longer a redirect): the merged feed +
  portfolio summary.
- `/portfolio` → redirect to `/activity`.
- `/leaders` → redirect to `/discover` (i.e. `/market`).
- `/settings` — still routable, reached via the header gear.

### Mirror (`/home`) — command center, no duplication
- **Hero:** balance + wallet connection status.
- **🔴 "Needs your attention":** the priority block — pending copy confirmations.
  Tapping a row opens the CopyConfirmSheet (section 3). This is the center of the
  flow.
- **"Mirroring now":** compact list of 2–3 active strategies (summary, not the full
  list).
- **CTA:** "Discover leaders" → Discover.
- **Removed from Mirror:** the full activity feed and the long leaders list.

### Discover (`/market`) — find & follow only
Leaders list, leader detail card / bottom sheet, and the follow strategy form. The
Activity sub-tab is removed.

### Activity (`/activity`) — results of my copying
- **Top:** compact PnL / strategies summary (absorbs the Portfolio screen).
- **Below:** the single chronological feed of copied trades with their decision and
  execution states, with the existing filter chips (All / Accepted / Review /
  Rejected).
- Rows can open the CopyConfirmSheet for pending executions.

## 3. Omniston — deeper, surfaced usage

### 3a. CopyConfirmSheet (new, theme-aware)
A dedicated bottom-sheet component that replaces the inline `QuoteCard` embedded in
activity rows. Opened from Mirror's "Needs your attention" and from Activity rows.

Contents, in order:
- Sell → receive amounts with token symbols.
- Rate (1 X = N Y).
- Slippage.
- **Route + resolver** — "best route via {resolverName}" (section 3c).
- Expiry countdown.
- One primary button: Confirm → `prepare` → sign via TON Connect → `submit`.

It drives the same `useExecutionFlow` steps the current `QuoteCard` uses
(quoted → prepared → submitted), so the underlying execution logic is unchanged —
only the presentation and entry points change. The Terminal and Glass variants share
the flow; only styling differs.

`components/activity/QuoteCard.tsx` is retired in favour of this sheet (or refactored
into the sheet's body). The Glass theme no longer renders terminal-styled quote UI.

### 3b. Live prices / PnL
New `server/services/pricing.service.ts`:
- `getTonUsd(): Promise<number>` — fetches a TON↔USDT quote through the Omniston
  quote provider when `NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true`.
- Short in-memory cache keyed by timestamp window (serverless-safe; no background
  process). On error or in demo mode it falls back to the current constant (3).
- Replaces the hardcoded `ROUGH_TON_USD = 3` wherever USD estimates are computed.

This must never throw into the request path — wrap and fall back, consistent with the
decision pipeline's never-throw rule.

### 3c. Route transparency
`NormalizedQuote` already carries `routeSummary` and `resolverName`. Surface them as a
single tidy line in the CopyConfirmSheet and in execution detail, as a trust signal —
no new data plumbing required.

## 4. Demo-first & feature flags

- Everything new sits behind the existing flags. The default (`live source = false`)
  path keeps working with no live infra.
- CopyConfirmSheet renders the mock quote when live is off.
- `pricing.service` falls back to `3` in demo / on error.
- Every new screen state has a loading skeleton, an empty state, and an error state.
- Idempotency and the never-throw decision pipeline are untouched.

## 5. Out of scope

- TON DNS / `.ton` names (deferred entirely).
- Manual (non-copy) swap via Omniston.
- Reverse-DNS index, follow-by-name, own-wallet `.ton` name.
- Real-time PnL accounting beyond the existing approximation.

## Risks / notes

- Merging Portfolio into Activity: confirm the Portfolio screen has no unique data
  that lacks a home in the merged layout; port the PnL summary, drop duplicated
  strategy listing.
- Extracting theme components is a large mechanical move — do it screen-by-screen,
  keeping each screen visually identical before layering IA changes on top, so
  regressions stay isolated.
- `pricing.service` live calls add latency to any path that needs USD; cache window
  and fallback must keep the demo instant.
