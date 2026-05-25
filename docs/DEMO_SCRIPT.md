# Hackathon Demo Script

> **Duration:** ~5 minutes  
> **Mode:** Demo (no live infra required)  
> **Setup:** dev server running, DB seeded  

---

## Before you start

```bash
# Terminal 1 — keep this running
npm run dev

# Terminal 2 — seed if not already done
npx prisma db seed
```

Open `http://localhost:3000` in a browser. Keep the browser devtools **closed** — the console errors about `config.ton.org` are cosmetic (TON Connect fetching wallets list) and don't affect the demo.

---

## Script

### Act 1 — The pitch (30 sec)

> *"TonMirror is a Telegram Mini App that lets anyone copy-trade the best wallets on TON — automatically, inside Telegram. No charts to read, no signals to decode. You follow a whale, set your rules, and our engine mirrors their swaps through STON.fi."*

Show the **Home** screen.  
Point to: wallet card (TON Connect), stats row (Following / Copied / Volume), "Browse Leaders" CTA.

---

### Act 2 — Browse and follow a leader (60 sec)

1. Tap **Leaders** tab.
2. Show 3 seeded wallets:
   - Alpha Whale 🐋 — low risk, 78% win rate
   - DeFi Degen 🎰 — high risk, high activity
   - Steady Eddie 📈 — conservative, stablecoin pairs
3. Tap **Alpha Whale 🐋** card → opens Leader Detail.
4. Walk through the stats grid and notes.
5. Fill in the **Strategy Form**:
   - Mode: Fixed amount → $10 per trade
   - Slippage: 1%
   - Manual confirm: ON
6. Tap **Start Copy-Trading**.
   - "Following ✓" badge appears.

> *"Every copy strategy is fully configurable: amount, slippage, manual confirm, sell-mirroring. You're in control."*

---

### Act 3 — The pipeline fires (90 sec)

1. Navigate to **Settings** → Demo Controls card.
2. Tap **⚡️ Emit Profitable Trade**.
   - Toast appears: "TON → USDT emitted. 1 decision(s) created."
3. Navigate to **Activity** tab.
   - New event at top: Alpha Whale 🐋 · 100 TON → USDT · Review · Pending
4. Tap **Get Quote →** button.
   - QuoteCard expands:
     - You sell **10 TON** → You receive **60.88 USDT**
     - Rate: 1 TON = 6.15 USDT
     - Slippage: 1.00%
     - Route: STON.fi (mock)
     - Countdown: 29s
5. Tap **Confirm Quote →** (shows "Preparing transaction…" then prepared view).

> *"The whole pipeline — detection, evaluation, quote fetch, transaction building — runs in under a second. The user just taps Confirm."*

---

### Act 4 — Risk guards (45 sec)

1. Back in **Settings**, tap **⚠️ Emit Risky Trade**.
   - A DeFi Degen trade fires: 500 TON → NOT
2. Then tap **🚫 Emit Blocked-Token Trade**.
   - DOGS trade fires.
3. Navigate to **Activity**.
   - Show two **Rejected** entries with "blocked token" risk flag.

> *"The strategy engine rejected both automatically. Token blocklists, max size guards, daily spend caps — all configurable per-wallet."*

---

### Act 5 — Portfolio & reset (30 sec)

1. Navigate to **Portfolio** tab.
   - Show Active Strategies (Alpha Whale — Active).
   - Show Copied / Rejected counts.
   - Demonstrate Pause button.
2. Go back to **Settings** → tap **🔄 Reset Demo Data**.
   - Toast: "Demo data reset to initial state."
   - Activity feed returns to seed data.

> *"One tap to reset. Perfect for demos, and idempotent for CI."*

---

### Act 6 — Architecture (60 sec, for technical judges)

Open the README or draw on a whiteboard:

```
TON Blockchain → Webhook → TonWebhookTradeSource
                                     ↓
                           StrategyEvaluator (Zod-validated rules)
                                     ↓
                           DecisionService (accepted/review/rejected)
                                     ↓
                           OmnistonQuoteProvider (STON.fi RFQ)
                                     ↓
                           TON Connect (user signs, keys never leave device)
```

Key points:
- **All integrations behind interfaces** — swap the DEX, swap the indexer, business logic doesn't change
- **Demo-first** — judges never see a broken state; everything is seeded and deterministic
- **TypeScript strict mode** — zero `any`, Zod at every boundary
- **18 unit + integration tests, 13 E2E tests** — all green

---

## Common questions

**Q: Does it work in real Telegram?**  
A: Yes. Deploy to Vercel, point BotFather to the URL, and the Mini App opens natively inside Telegram. See `docs/DEPLOYMENT.md`.

**Q: Is the Omniston quote real?**  
A: In demo mode, quotes come from a mock provider with realistic rates. Set `NEXT_PUBLIC_ENABLE_LIVE_SOURCE=true` and provide a TonAPI key to get live STON.fi quotes via the Omniston SDK.

**Q: What happens on the blockchain?**  
A: The `PreparedTransaction` (messages + payload) is built by Omniston and signed by the user's wallet via TON Connect. We never hold private keys. The `/api/execution/submit` endpoint is stubbed with a detailed TODO — broadcasting on-chain without proper re-entrancy guards is out of scope for the MVP.

**Q: How do you prevent duplicate copy trades?**  
A: `TradeEvent` has a unique constraint on `externalId`. `tradesRepo.upsert()` is idempotent. The webhook route always returns 200 to prevent indexer retries.

**Q: Can one user follow multiple wallets?**  
A: Yes — one `FollowStrategy` row per (user × leader) pair. The Portfolio screen manages all of them.
