# Plan — TonMirror: from demo-MVP to a fully working live product

**Date:** 2026-06-05
**Goal:** Turn the current demo-stable MVP into a genuinely working copy-trading product:
real on-chain trade ingestion, real quote/sign/submit, and real transaction
confirmation — while keeping demo mode fully functional as the default.

---

## 0. Current state (verified 2026-06-05)

- `tsc --noEmit` clean. `vitest run` → **40/40 pass**.
- Architecture from `CLAUDE.md` is respected: `modules/` → `server/` → `app/`, DI via interfaces.
- Decision pipeline (`server/services/decision.service.ts`) is real, never-throws, writes audit logs.
- Execution flow quote→prepare→sign→submit is wired in `app/(tabs)/market/page.tsx` via
  `components/activity/QuoteCard.tsx`, using real TON Connect.
- Omniston quote (mock + live) and trade source (mock + live) are both implemented behind factories.
- `TonWebhookTradeSource.getRecentTrades()` is a **real** TonAPI v2 implementation, not a stub.

### The core gap

`getTradeSource()` exists but is **never called from anywhere in `app/` or `server/`**.
`MockLeaderTradeSource.start()` uses `setInterval`, which cannot run on Vercel serverless
(no long-lived process). Result: copy decisions are only ever produced by:
1. the demo panel (`POST /api/demo/trade`), or
2. an external indexer pushing to `POST /api/webhooks/ton` (live source only).

There is **no automatic ingestion loop**. That is what makes this a demo, not a product.

### Secondary gaps

- `submitExecution` stores only the first 64 chars of the BoC; status never advances past
  `submitted` → no `confirmed`, no real txHash.
- USD estimates in live `getRecentTrades` are hardcoded (`ROUGH_TON_USD = 3`).
- `prepare` route does not require `walletAddress` even when live.
- Repo hygiene: ~20 PNG screenshots + `.playwright-mcp/` logs committed at root.
- `next.config.ts` uses non-standard `X-Frame-Options: ALLOWALL` instead of CSP `frame-ancestors`.

---

## Phase A — Automatic trade-ingestion cron (THE core deliverable)

A poll-based loop that works identically for mock and live sources (flag-selected),
so it makes both demo and production "alive" without a persistent process.

**New: `server/services/ingestion.service.ts`**
- `pollAllLeaders(): Promise<{ leaders: number; newEvents: number; decisions: number }>`
- Loads distinct active leaders that have ≥1 active (non-paused) strategy
  (new repo method `leadersRepo.listFollowedActive()`).
- `const source = await getTradeSource()` (mock or live by flag).
- For each leader: `const trades = await source.getRecentTrades(address)`.
- Feed each event to `decisionService.processTradeEvent(event)`.
  Dedup is automatic: `tradesRepo.upsert` keys on `externalId`, so already-seen trades
  re-upsert without creating duplicate decisions (verify decision step also guards on
  "decision already exists for this trade+strategy" — add `decisionsRepo.existsFor(tradeId, strategyId)`).
- Never throws; per-leader try/catch + audit log.

**New: `app/api/cron/poll-trades/route.ts`**
- Auth: `Authorization: Bearer ${CRON_SECRET}` (reuse pattern from `cron/discover-whales`).
- Calls `ingestionService.pollAllLeaders()`, returns the summary.

**Edit: `vercel.json`** — add the cron entry.
- ⚠️ **Vercel Hobby allows only daily crons.** For real-time copy-trading you need either
  Vercel Pro (per-minute crons) or an external scheduler (cron-job.org / QStash / GitHub
  Actions) hitting `/api/cron/poll-trades` every 1–2 min with the `CRON_SECRET`.
  Document both; default `vercel.json` to daily so Hobby deploys don't fail.

**New idempotency guard:**
- Add `decisionsRepo.existsFor(tradeEventId, strategyId)` and skip in the pipeline if true.
  This makes re-polling the same recent window safe.

**Acceptance:**
- `curl -H "Authorization: Bearer <CRON_SECRET>" .../api/cron/poll-trades` returns a summary.
- Running it twice in a row does NOT create duplicate decisions.
- Works in demo mode (mock source) and live mode (flag on) with no code change.

---

## Phase B — Transaction confirmation (submitted → confirmed)

**Edit: `server/services/execution.service.ts`**
- `submitExecution`: parse the signed BoC with `@ton/core` to extract the external-message
  hash → store as `txHash` (replaces the 64-char slice). Fall back to slice on parse error.

**New: `server/services/confirmation.service.ts`**
- `sweepPending(): Promise<{ checked: number; confirmed: number; failed: number }>`
- Loads executions with status `submitted` older than ~5s and younger than ~10min.
- For each: query TonAPI `/v2/blockchain/messages/{hash}/transaction` (or account events)
  to resolve the on-chain tx; on success set `confirmed` + canonical `txHash`,
  on definitive failure set `failed` with `failureReason`.

**New: `app/api/cron/confirm-executions/route.ts`** — CRON_SECRET auth → `sweepPending()`.

**New dependency:** `@ton/core` (BoC parsing). Keep behind dynamic import so demo bundle stays lean.

**Acceptance:**
- After a live signed send, a confirm sweep moves the execution to `confirmed` with a real hash.
- Demo executions (mock, no real BoC) are skipped gracefully, never marked failed by mistake.

---

## Phase C — Live source enablement (no external webhook required)

Because Phase A polls TonAPI directly, **webhooks become optional** — the poller is the
primary live path. Keep the webhook route as an alternative low-latency push path.

- Document `.env` for live: `NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true`, `TON_API_KEY`, real `DATABASE_URL`.
- Remove the in-memory `watchedWallets` dependency from the poll path (poller reads leaders
  from the DB each run — stateless, serverless-safe).
- Keep `webhooks/ton` for users who wire an indexer; it already runs the same pipeline.

**Acceptance:** with the flag on + a real `TON_API_KEY`, the poller ingests real swaps from
seeded leader addresses and produces decisions.

---

## Phase D — Hardening & accuracy

- **Real USD pricing:** replace `ROUGH_TON_USD = 3` in `ton-webhook-source.getRecentTrades`
  with a price lookup (reuse `app/api/prices` / `usePrices` source server-side). Daily-cap
  enforcement depends on accurate USD.
- **Prepare guard:** in `app/api/execution/prepare/route.ts`, require `walletAddress` when
  `NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true`.
- **Security headers:** in `next.config.ts`, replace `X-Frame-Options: ALLOWALL` with CSP
  `frame-ancestors https://web.telegram.org https://*.telegram.org` (ALLOWALL is not a valid value).
- **Repo hygiene:** add `*.png` (root screenshots) and `.playwright-mcp/` to `.gitignore`;
  `git rm --cached` the committed artifacts.
- **README:** correct the status table — ingestion is cron/webhook-driven, confirmation added.

---

## Phase E — Tests & verification

- Unit: `ingestion.service` dedup (same trade twice → 1 decision); `existsFor` guard.
- Unit: BoC hash extraction in `execution.service`.
- Integration: `/api/cron/poll-trades` (auth 401 without secret; summary with secret;
  idempotent on repeat). `/api/cron/confirm-executions` happy path with mocked TonAPI.
- e2e: existing smoke still green.
- Gate: `pnpm type-check && pnpm test` clean before each phase is considered done.

---

## Suggested execution order

1. Phase A (ingestion cron) — unlocks the whole product loop.
2. Phase B (confirmation) — closes the execution lifecycle.
3. Phase D hardening items (cheap, parallelizable).
4. Phase C live enablement + manual live smoke with a real key.
5. Phase E tests throughout; README/CLAUDE status last.

## Out of scope (unchanged from MVP boundaries)

Real-time PnL accounting, custodial funds, multi-wallet, social graph, roles.
