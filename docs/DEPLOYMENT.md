# Deployment Guide

> **Demo mode requires only a PostgreSQL database.**  
> No TON API key, no Telegram bot, no webhook infra is needed to run the app locally or for a judge demo.

---

## Contents

1. [Local dev](#1-local-dev)
2. [Production deploy (Vercel)](#2-production-deploy-vercel)
3. [Self-hosted (VPS / Docker)](#3-self-hosted-vps--docker)
4. [BotFather setup](#4-botfather-setup)
5. [Environment variables reference](#5-environment-variables-reference)
6. [Live webhook setup](#6-live-webhook-setup)
7. [Production TODO checklist](#7-production-todo-checklist)

---

## 1. Local dev

```bash
# Requires: Node 20+, PostgreSQL 15+

# Install deps
npm install

# Copy and fill env
cp .env.example .env.local
# At minimum: set DATABASE_URL

# Migrate + seed
npx prisma migrate dev
npx prisma db seed

# Start
npm run dev
# → http://localhost:3000
```

The app runs fully in **demo mode** by default. No Telegram client required — a mock user is injected automatically.

---

## 2. Production deploy (Vercel)

### Prerequisites
- Vercel account + project linked to this repo
- PostgreSQL database (Neon, Supabase, Railway, or self-hosted)

### Steps

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project (first time only)
vercel link

# 3. Push env vars
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_APP_URL production          # https://your-app.vercel.app
vercel env add NEXT_PUBLIC_TONCONNECT_MANIFEST_URL production
vercel env add NEXT_PUBLIC_TELEGRAM_BOT_USERNAME production
vercel env add TON_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_ENABLE_DEMO_MODE production  # "true"
vercel env add NEXT_PUBLIC_ENABLE_LIVE_SOURCE production # "false" for demo, "true" for live

# 4. Run migrations on production DB
DATABASE_URL="<your-prod-url>" npx prisma migrate deploy
DATABASE_URL="<your-prod-url>" npx prisma db seed

# 5. Deploy
vercel --prod
```

### vercel.json (optional overrides)

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "functions": {
    "app/api/webhooks/ton/route.ts": {
      "maxDuration": 10
    }
  }
}
```

---

## 3. Self-hosted (VPS / Docker)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV PORT=3000 NODE_ENV=production
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports: ["3000:3000"]
    env_file: .env.production
    depends_on: [postgres]
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: tonmirror
      POSTGRES_USER: tonmirror
      POSTGRES_PASSWORD: changeme
    volumes: [pgdata:/var/lib/postgresql/data]
volumes:
  pgdata:
```

Add to `next.config.ts`:
```ts
output: "standalone"
```

---

## 4. BotFather setup

### Create the bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send `/newbot`
3. Choose a **display name**: e.g. `TonMirror`
4. Choose a **username** (must end in `bot`): e.g. `tonmirror_bot`
5. Copy the **API token** — you won't need it for the Mini App itself, but keep it safe

### Configure Mini App

```
/newapp
→ select your bot (@tonmirror_bot)
→ App title: TonMirror
→ Description: Copy TON whale wallets automatically
→ Photo: upload a 640×360 PNG cover
→ Demo GIF: optional
→ Web App URL: https://your-app.vercel.app
```

After creation BotFather gives you a **direct link**: `https://t.me/tonmirror_bot/app`

### Add to menu button (optional)

```
/setmenubutton
→ select your bot
→ Enter URL: https://your-app.vercel.app
→ Enter button text: Open TonMirror
```

### TON Connect manifest

The file `public/tonconnect-manifest.json` must be publicly accessible:

```json
{
  "url": "https://your-app.vercel.app",
  "name": "TonMirror",
  "iconUrl": "https://your-app.vercel.app/icon-192.png"
}
```

Set env vars:
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_TONCONNECT_MANIFEST_URL=https://your-app.vercel.app/tonconnect-manifest.json
```

---

## 5. Environment variables reference

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` | Public URL for TON Connect manifest |
| `NEXT_PUBLIC_TONCONNECT_MANIFEST_URL` | ✅ | localhost path | Must be publicly reachable |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | ✅ (prod) | — | BotFather username, no `@` |
| `TON_WEBHOOK_SECRET` | live only | — | Random secret ≥ 32 chars |
| `TON_API_KEY` | live only | — | TonAPI / Toncenter API key |
| `NEXT_PUBLIC_ENABLE_DEMO_MODE` | — | `"true"` | Shows demo control panel |
| `NEXT_PUBLIC_ENABLE_LIVE_SOURCE` | — | `"false"` | Activates TON webhook ingestion |

Generate a strong webhook secret:
```bash
openssl rand -hex 32
```

---

## 6. Live webhook setup

> Only needed when `NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true`.

### TonAPI (recommended)

1. Create account at [tonconsole.com](https://tonconsole.com)
2. Get an API key
3. Register a webhook:

```bash
curl -X POST https://tonapi.io/v2/webhooks \
  -H "Authorization: Bearer <TON_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://your-app.vercel.app/api/webhooks/ton",
    "secret_key": "<TON_WEBHOOK_SECRET>",
    "accounts": [
      "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL"
    ]
  }'
```

4. Set env vars:
```
NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true
TON_WEBHOOK_SECRET=<same secret>
TON_API_KEY=<your key>
```

5. Test:
```bash
curl -X POST https://your-app.vercel.app/api/webhooks/ton \
  -H "x-webhook-secret: <secret>" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"test","timestamp":1716670000,"account":{"address":"UQ…"},"actions":[]}'
# → {"data":{"ok":true,"processed":false,"reason":"not_a_swap"}}
```

---

## 7. Production TODO checklist

### Security
- [ ] `TON_WEBHOOK_SECRET` set to a cryptographically random value (≥ 32 bytes)
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require`)
- [ ] Vercel env vars set to `Production` scope only (not `Preview`)
- [ ] TON Connect manifest URL is HTTPS

### Data
- [ ] `npx prisma migrate deploy` run against production DB (not `migrate dev`)
- [ ] `npx prisma db seed` run once after first deploy
- [ ] Backup strategy in place for PostgreSQL

### Telegram
- [ ] BotFather Mini App URL points to production (not localhost)
- [ ] `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` set in production env
- [ ] Test the direct link `https://t.me/<bot>/app` inside Telegram on mobile

### TON Connect
- [ ] `public/tonconnect-manifest.json` contains correct production URL
- [ ] Icon file at `NEXT_PUBLIC_APP_URL/icon-192.png` exists and is reachable
- [ ] Test wallet connection with Tonkeeper / MyTonWallet

### Performance
- [ ] Prisma connection pooling configured (PgBouncer or Prisma Accelerate) for serverless
- [ ] Database has indexes on `LeaderWallet.address` and `TradeEvent.externalId` (added in migration)

### Monitoring
- [ ] Error tracking configured (Sentry, Axiom, or similar)
- [ ] Set up alerts on `/api/webhooks/ton` 401 rate spike (possible secret leak)

### Final checks
- [ ] `npm run build` passes locally with production env
- [ ] `npm run type-check` returns 0 errors
- [ ] `npm test -- --run` returns 0 failures
- [ ] `npx playwright test` returns 0 failures (against staging URL)
- [ ] App tested end-to-end inside actual Telegram mobile client
