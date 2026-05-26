# Whale Discovery Design

**Goal:** Automatically discover profitable whale wallets on the TON blockchain and populate the Leaders list via a two-stage crawler running every 6 hours on Vercel Cron.

**Architecture:** Stage 1 uses STON.fi public API (no auth) to collect wallet candidates from top pools. Stage 2 uses TonAPI (with `TON_API_KEY`) to score each candidate by volume + win rate + activity. Scored wallets are upserted into `LeaderWallet` with `sourceType = auto_discovered`. Results persist in Neon — each cron run only re-scores stale entries.

**Tech Stack:** Next.js 15 App Router, TypeScript strict, Prisma 5, Neon PostgreSQL, TonAPI v2, STON.fi v1 API, Vercel Cron

---

## 1. Data Flow

```
Vercel Cron (0 */6 * * *)
  └→ GET /api/cron/discover-whales   [Authorization: Bearer CRON_SECRET]
       └→ WhaleCrawlerService.run()
            │
            ├─ Stage 1: STON.fi (no auth, fast)
            │    GET /v1/pools?limit=10              → top 10 pools by TVL
            │    GET /v1/pools/{id}/operations?limit=200  → recent swaps
            │    Aggregate by wallet address         → top 200 candidates
            │    Filter: rawVolumeUsd > $500         → ~50–100 candidates
            │
            ├─ Stage 2: TonAPI (TON_API_KEY, top 50 by raw volume)
            │    GET /v2/accounts/{addr}/events?limit=100&subject_only=true
            │    Extract JettonSwap events for last 30 days
            │    Calculate per wallet:
            │      volume_score  = log(volumeUsd30d) / log(MAX_VOL), clamped 0–1
            │      win_rate      = profitable_exits / total_exits
            │      activity      = min(1, tradesPerDay / 10)
            │      score         = volume_score×0.4 + win_rate×0.4 + activity×0.2
            │
            └─ DB upsert (score ≥ WHALE_MIN_SCORE, max WHALE_MAX_LEADERS entries)
                 LeaderWallet.sourceType = auto_discovered
                 Updates: winRateApprox, activityScore, discoveryScore,
                          volumeUsd30d, tradeCount30d, lastDiscoveredAt, tags
```

---

## 2. New Modules

### `modules/whale-discovery/types.ts`
```ts
export interface WalletCandidate {
  address:      string;
  rawVolumeUsd: number;   // Stage 1: 24h volume from STON.fi
  swapCount:    number;
}

export interface WhaleScore {
  address:       string;
  volumeUsd30d:  number;
  winRate:       number;       // 0–1
  tradesCount:   number;
  activityScore: number;       // 0–1
  score:         number;       // composite 0–1
  tags:          string[];     // ["auto", "high-volume" | "balanced" | "active"]
}
```

### `modules/whale-discovery/ston-fi-client.ts`
- `getTopPools(limit: number): Promise<{ id: string }[]>` — `GET /v1/pools`
- `getPoolOperations(poolId: string, limit: number): Promise<WalletCandidate[]>` — `GET /v1/pools/{id}/operations`, groups by `user_address`

### `modules/whale-discovery/tonapi-client.ts`
- `getAccountSwaps(address: string, days: number): Promise<SwapEvent[]>` — `GET /v2/accounts/{addr}/events?limit=100&subject_only=true`, filters `type === "JettonSwap"`
- Respects 1 req/s rate limit with 1100ms delay between calls

### `modules/whale-discovery/scorer.ts`
- `scoreWallet(swaps: SwapEvent[]): WhaleScore` — pure function, no side effects
- Win rate: counts exits where `usdOut > usdIn * 1.01` as profitable
- Tags assigned by score tier: `score ≥ 0.7` → `"alpha"`, `0.5–0.7` → `"balanced"`, `< 0.5` → `"active"`

### `modules/whale-discovery/crawler.ts`
- `run(options): Promise<WhaleScore[]>` — orchestrates Stage 1 → Stage 2 → returns scored wallets
- Deduplicates candidates, caps Stage 2 at 50 wallets to stay within API limits

---

## 3. Schema Changes

Add to `LeaderWallet` model in `prisma/schema.prisma`:
```prisma
discoveryScore   Float?
volumeUsd30d     Float?
tradeCount30d    Int?
lastDiscoveredAt DateTime?
```

Add to `LeaderSourceType` enum:
```prisma
auto_discovered
```

Migration: `prisma migrate dev --name add-whale-discovery-fields` — additive only, no breaking changes.

---

## 4. Server Service

### `server/services/whale-crawler.service.ts`
```ts
runDiscovery(options?: { dryRun?: boolean; maxLeaders?: number }): Promise<CrawlerResult>
```
- Calls `crawler.run()`
- If `dryRun`: returns result without writing to DB
- Otherwise: upserts each `WhaleScore` into `LeaderWallet` via `leadersRepo`
- Returns `{ discovered, updated, skipped, durationMs }`

---

## 5. API Routes

### `app/api/cron/discover-whales/route.ts`
- `GET` handler
- Checks `Authorization: Bearer ${CRON_SECRET}` — returns 401 if missing/wrong
- Calls `WhaleCrawlerService.runDiscovery()`
- Returns `{ data: CrawlerResult }`

### `app/api/demo/discover-whales/route.ts`
- `POST` handler (no auth — demo only, guarded by `isDemoMode`)
- Body: `{ dryRun?: boolean }`
- Calls `WhaleCrawlerService.runDiscovery({ dryRun })`
- Returns `{ data: { result: CrawlerResult, whales?: WhaleScore[] } }`

---

## 6. Infrastructure

### `vercel.json`
```json
{
  "crons": [
    { "path": "/api/cron/discover-whales", "schedule": "0 */6 * * *" }
  ]
}
```

### New environment variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `TON_API_KEY` | Yes (prod) | — | TonAPI Bearer token |
| `CRON_SECRET` | Yes (prod) | — | Secures cron endpoint |
| `WHALE_MIN_SCORE` | No | `0.3` | Minimum score threshold |
| `WHALE_MAX_LEADERS` | No | `50` | Max auto-discovered entries in DB |

---

## 7. UI Changes

### `app/(tabs)/leaders/page.tsx`
- Import `Badge` with new `"auto"` variant
- Show `[AUTO]` badge if `leader.sourceType === "auto_discovered"`
- Add metrics row: `VOL·30D`, win rate, trade count (from new fields)

### `app/(tabs)/settings/page.tsx`
- New `WHALE·SCANNER` card (visible always, not just in demo mode)
- Shows `lastDiscoveredAt` of the most recently updated auto-discovered leader
- `[▸ RUN·SCAN·NOW]` → POST `/api/demo/discover-whales` → invalidates leaders cache
- `[▸ DRY·RUN·PREVIEW]` → shows modal/list of what would be added

### `app/(tabs)/leaders/[id]/page.tsx`
- If `sourceType === "auto_discovered"`: show `SOURCE: AUTO·CRAWLER · score X.XX`

---

## 8. Error Handling

- STON.fi unavailable → skip Stage 1, log warning, return cached leaders unchanged
- TonAPI rate limit (429) → exponential backoff, max 3 retries per wallet, skip on failure
- TonAPI unavailable → skip Stage 2, still upsert Stage 1 candidates with partial data (`score = null`)
- No candidates found → no DB writes, log info
- Cron timeout (Vercel max 300s) → process at most 30 wallets in Stage 2 on free plan

---

## 9. Out of Scope

- DeDust integration (can be added later as a second Stage 1 source)
- Webhook-based real-time trade tracking for discovered whales
- Admin approval flow before leaders appear in UI
- Historical PnL tracking per leader
