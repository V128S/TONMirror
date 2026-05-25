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

</div>

---

## 💎 What is TonMirror?

> **The market doesn't care about your analysis. It cares about what whales do.**

TonMirror is a Telegram Mini App that lets you **follow the wallets that actually make money** — and copy their every move on the TON blockchain in real time.

No charts to read. No signals to decode. No FOMO-driven decisions at 3 AM.  
Just set your strategy once, and let the alpha flow.

```
Leader wallet buys STON  →  You buy STON  →  Leader sells STON  →  You sell STON
                                                         ↑
                                              All inside Telegram.
                                              All through STON.fi.
                                              Your keys. Your coins.
```

---

## ⚡ How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   TON Blockchain                        │
│  Whale wallet executes swap → Event captured            │
└────────────────────┬────────────────────────────────────┘
                     │ NormalizedTradeEvent
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Strategy Evaluation Engine                 │
│  ✓ Token allowlist/blocklist                           │
│  ✓ Max trade size guard                                │
│  ✓ Daily spend cap                                     │
│  ✓ Slippage tolerance                                  │
│  ✓ Risk scoring                                        │
└────────────────────┬────────────────────────────────────┘
                     │ Decision: accepted / review / rejected
                     ▼
┌─────────────────────────────────────────────────────────┐
│           Omniston Quote Engine (STON.fi)               │
│  Best route found → Quote preview shown to user        │
└────────────────────┬────────────────────────────────────┘
                     │ User confirms (or auto-executes)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              TON Connect Wallet                         │
│  Transaction signed & sent. Activity feed updated.     │
└─────────────────────────────────────────────────────────┘
```

---

## 🐋 Features

| Feature | Status |
|---|---|
| 📡 Follow any TON leader wallet | ✅ |
| ⚙️ Configurable copy strategy per leader | ✅ |
| 🔍 Real-time trade signal evaluation | ✅ |
| 💹 Omniston / STON.fi quote preview | ✅ |
| 🖐 Manual confirm or auto-copy mode | ✅ |
| 🛡 Token blocklist & risk guards | ✅ |
| 💰 Daily spend cap | ✅ |
| 📊 Activity feed & portfolio tracking | ✅ |
| 🎮 Full demo mode (no infra needed) | ✅ |
| 🔗 TON Connect wallet integration | ✅ |
| 🌑 Telegram-native dark UI | ✅ |

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
npx prisma db seed      # loads 3 whale wallets + trade history

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
| `TON_WEBHOOK_SECRET` | Shared secret for live TON events |
| `TON_API_KEY` | Optional — live TON indexer key |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | `"true"` — enables demo control panel |
| `NEXT_PUBLIC_ENABLE_LIVE_SOURCE` | `"true"` — activates live webhook source |

---

## 🎮 Demo Mode

TonMirror ships **fully battle-tested in demo mode** — zero live infra needed.

Fire up the Settings panel and:

- 📈 **Emit a profitable trade** — watch the pipeline accept & quote it
- ⚠️ **Emit a risky trade** — triggers manual review flow
- 🚫 **Emit a blocked token** — rejection logged instantly
- 🔄 **Reset all data** — back to factory seed in one tap

Three seeded whale wallets are ready to follow from day one.

---

## 🛠 Dev Commands

```bash
pnpm dev             # development server
pnpm build           # production build
pnpm lint            # ESLint
pnpm type-check      # tsc --noEmit
pnpm test            # Vitest unit tests
pnpm test:e2e        # Playwright smoke tests

npx prisma studio    # visual DB browser
npx prisma db seed   # re-seed demo data (idempotent)
```

---

## 🏗 Architecture

```
app/          → routes, layouts, screens (Next.js App Router)
components/   → UI atoms: Button, Card, Badge, TabBar, BottomSheet
lib/          → env, prisma singleton, format utils
modules/      → pure TS domain logic (no framework imports)
  ├─ strategy/        → evaluation engine + filter rules
  ├─ trade-ingestion/ → MockLeaderTradeSource + TonWebhookTradeSource
  ├─ omniston/        → QuoteProvider adapter (STON.fi / Omniston)
  └─ execution/       → PreparedExecution builder
server/       → services, repositories, background jobs
prisma/       → schema + idempotent seed
tests/        → unit / integration / e2e
```

> All external integrations are hidden behind interfaces.  
> Swap the DEX, swap the indexer, swap the wallet — business logic doesn't care.

---

## ⚙️ Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Data fetching | TanStack Query |
| Validation | Zod |
| Database | PostgreSQL + Prisma |
| Web3 | @tonconnect/ui-react |
| DEX | @ston-fi/omniston-sdk-react |
| Tests | Vitest + Playwright |
| Package manager | pnpm |

---

<div align="center">

**Built for the TON ecosystem. Designed for the alpha-hungry.**

*Your keys. Your strategy. Their moves.*

</div>
