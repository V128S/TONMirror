<div align="center">

```
████████╗ ██████╗ ███╗   ██╗    ███╗   ███╗██╗██████╗ ██████╗  ██████╗ ██████╗ 
╚══██╔══╝██╔═══██╗████╗  ██║    ████╗ ████║██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
   ██║   ██║   ██║██╔██╗ ██║    ██╔████╔██║██║██████╔╝██████╔╝██║   ██║██████╔╝
   ██║   ██║   ██║██║╚██╗██║    ██║╚██╔╝██║██║██╔══██╗██╔══██╗██║   ██║██╔══██╗
   ██║   ╚██████╔╝██║ ╚████║    ██║ ╚═╝ ██║██║██║  ██║██║  ██║╚██████╔╝██║  ██║
   ╚═╝    ╚═════╝ ╚═╝  ╚═══╝    ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝
```

### *Stop guessing. Start mirroring.*

**Copy the alpha of TON's best traders — automatically, inside Telegram.**

[![TON](https://img.shields.io/badge/TON-Blockchain-0088CC?style=for-the-badge&logo=telegram)](https://ton.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![STON.fi](https://img.shields.io/badge/STON.fi-Omniston-7B2FBE?style=for-the-badge)](https://ston.fi)

[![Live](https://img.shields.io/badge/▶_Live-tonmirror.vercel.app-39d353?style=flat-square)](https://tonmirror.vercel.app)
[![Tests](https://img.shields.io/badge/tests-109%2B_unit%2Fintegration_+_E2E-6E9F18?style=flat-square&logo=vitest&logoColor=white)](#-tests)
[![Mode](https://img.shields.io/badge/mode-demo_+_live_on--chain-0088CC?style=flat-square)](#-demo-vs-live)

</div>

---

## 💎 What is TonMirror?

> **The market doesn't care about your analysis. It cares about what whales do.**

TonMirror is a Telegram Mini App that lets you **follow the wallets that actually make money** — and copy their every move on the TON blockchain in real time.

No charts to read. No signals to decode. No FOMO-driven decisions at 3 AM.  
Just set your strategy once, and let the alpha flow.

```
Leader wallet buys USDT  →  You buy USDT  →  Leader sells USDT  →  You sell USDT
                                                         ↑
                                              All inside Telegram.
                                              All through STON.fi / Omniston.
                                              Your keys. Your coins.
```

---

## ⚡ How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   TON Blockchain                        │
│  Whale wallet executes swap → captured via TonAPI poll  │
│  (cron) or a live webhook push                          │
└────────────────────┬────────────────────────────────────┘
                     │ NormalizedTradeEvent (vetted pairs only)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Strategy Evaluation Engine                 │
│  ✓ Token allowlist/blocklist     ✓ Slippage tolerance  │
│  ✓ Max trade size guard          ✓ Risk scoring        │
│  ✓ Daily spend cap               ✓ Balance / gas check │
└────────────────────┬────────────────────────────────────┘
                     │ Decision: accepted / review / rejected
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Omniston Quote Engine (STON.fi)               │
│  Best route found → editable amount → quote preview     │
└────────────────────┬────────────────────────────────────┘
                     │ User reviews & confirms (non-custodial)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              TON Connect Wallet                         │
│  Transaction signed & sent. Activity feed updated.      │
└─────────────────────────────────────────────────────────┘
```

---

## 🐋 Features

| Feature | Status |
|---|---|
| 📡 Follow any TON leader wallet (auto-discovered or manual) | ✅ |
| 🔭 Live on-chain whale discovery & quality scoring | ✅ |
| ⚙️ Configurable copy strategy per leader | ✅ |
| 🔍 Real-time trade signal evaluation | ✅ |
| 📈 Whale activity — Day / Week / Month with **Net PnL & ROI** | ✅ |
| 💹 Omniston / STON.fi quote preview with **editable swap amount** | ✅ |
| 👛 Live wallet balances (TON / tsTON / USDT) | ✅ |
| 🖐 Manual confirm or auto-quote mode (signing always non-custodial) | ✅ |
| 🛡 Token blocklist, risk guards & balance/gas pre-check | ✅ |
| 💰 Daily spend cap | ✅ |
| 🏷 Human-friendly addresses (`UQ…`) + whale aliases ("Swift Orca") | ✅ |
| 📊 Per-user activity feed & portfolio tracking | ✅ |
| 🔐 Telegram `initData` HMAC auth + execution ownership guards | ✅ |
| 📱 True Telegram fullscreen (Bot API 8.0) | ✅ |
| 🎨 Three themes — glass **Light** / **Dark** + hidden **Terminal** | ✅ |
| 🎮 Full demo mode (no infra needed) | ✅ |
| 🔗 TON Connect wallet integration | ✅ |

> 🥚 **Hidden gesture:** tap the screen title 5× to flip into the phosphor **Terminal** theme — tap the `TON·MIRROR` logo 5× to flip back.

---

## 🔀 Demo vs Live

TonMirror runs in two interchangeable modes — the **same business logic**, different data sources.

| | 🎮 Demo | 📡 Live |
|---|---|---|
| Trade source | `MockLeaderTradeSource` (seeded whales) | `TonWebhookTradeSource` (TonAPI poll + webhook) |
| Quotes | Mock provider (STON/NOT/DOGS demo tokens) | Omniston RFQ over real liquidity |
| Execution | Simulated BoC | Real swap signed via TON Connect |
| Auth | Open (browser/dev) | Telegram `initData` verified + ownership-guarded |
| Pairs | All demo tokens | Vetted: **TON ⇄ USDT, tsTON → USDT** (real jetton masters, exact decimals) |

Toggle via `NEXT_PUBLIC_ENABLE_DEMO_MODE` / `NEXT_PUBLIC_ENABLE_LIVE_SOURCE`.

---

## 🚀 Quick Start

```bash
# 1. Clone & install
git clone https://github.com/V128S/TONMirror.git
cd TONMirror
pnpm install

# 2. Configure environment
cp .env.example .env.local
# → fill in DATABASE_URL and other vars

# 3. Spin up the database
npx prisma migrate dev
npx prisma db seed      # loads whale wallets + trade history

# 4. Launch
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — no Telegram client required in dev mode.

---

## 🔐 Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Your public URL (TON Connect manifest) |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | Full path to `tonconnect-manifest.json` |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | BotFather bot username |
| `TELEGRAM_BOT_TOKEN` | Bot token — verifies Telegram `initData` (HMAC) |
| `TON_API_KEY` | TonAPI key — live whale polling & balances |
| `TON_WEBHOOK_SECRET` | Shared secret for live TON webhook events |
| `CRON_SECRET` | Bearer secret guarding the poll/confirm cron routes |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `"true"` — enables demo control panel |
| `NEXT_PUBLIC_ENABLE_LIVE_SOURCE` | `"true"` — activates the live TonAPI/webhook source |

---

## 🎮 Demo Mode

TonMirror ships **fully battle-tested in demo mode** — zero live infra needed.

Fire up the Settings panel and:

- 📈 **Emit a profitable trade** — watch the pipeline accept & quote it
- ⚠️ **Emit a risky trade** — triggers manual review flow
- 🚫 **Emit a blocked token** — rejection logged instantly
- 🔄 **Reset all data** — back to factory seed in one tap

Seeded whale wallets are ready to follow from day one.

---

## 🛠 Dev Commands

```bash
pnpm dev             # development server
pnpm build           # production build (prisma generate + next build)
pnpm lint            # ESLint
pnpm type-check      # tsc --noEmit
pnpm test            # Vitest unit + integration
pnpm test:e2e        # Playwright smoke tests

npx prisma studio    # visual DB browser
npx prisma db seed   # re-seed demo data (idempotent)
```

---

## 🏗 Architecture

```
app/          → routes, layouts, screens (Next.js App Router)
components/   → UI atoms: Button, Card, Badge, TabBar, BottomSheet, quote cards
hooks/        → useQuoteFlow, useLeaderTrades, useWalletBalances, multi-tap …
lib/          → env, prisma singleton, ton-address, fetch-retry, format utils
modules/      → pure TS domain logic (no framework imports)
  ├─ strategy/        → evaluation engine + filter rules
  ├─ trade-ingestion/ → MockLeaderTradeSource + TonWebhookTradeSource
  ├─ omniston/        → QuoteProvider adapter (STON.fi / Omniston)
  └─ execution/       → PreparedExecution builder (hex→base64 BoC)
server/       → services, repositories, auth (initData), background jobs
prisma/       → schema + idempotent seed
tests/        → unit / integration / e2e
```

> All external integrations are hidden behind interfaces.  
> Swap the DEX, swap the indexer, swap the wallet — business logic doesn't care.

---

## ⚙️ Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router (`after()` background jobs) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS (3 themes) |
| Data fetching | TanStack Query |
| Validation | Zod |
| Database | PostgreSQL + Prisma |
| Web3 | `@tonconnect/ui-react`, `@ton/core` |
| DEX | `@ston-fi/omniston-sdk-react` |
| Indexer | TonAPI (polling, balances, swap parsing) |
| Auth | Telegram `initData` HMAC verification |
| Tests | Vitest (109+ unit/integration) + Playwright (E2E) |
| Package manager | pnpm |

---

## 📚 Docs

| Document | Description |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel deploy, BotFather setup, env vars, live webhook + cron config, production checklist |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Step-by-step hackathon demo script (5 min) |

---

## 🧪 Tests

```bash
pnpm test                  # 109+ unit + integration tests (Vitest)
pnpm test:e2e              # Playwright E2E smoke suite (requires running dev server)
```

Coverage spans the strategy evaluator, TonAPI / webhook swap parsing, token-map &
pricing math, friendly-address conversion & whale aliases, Telegram `initData`
verification, balance/gas pre-checks, and the execution quote/prepare/submit API —
plus an end-to-end demo flow in Playwright.

---

<div align="center">

**Built for the TON ecosystem. Designed for the alpha-hungry.**

*Your keys. Your strategy. Their moves.*

</div>
