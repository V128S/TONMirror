# Restore API Routes, Favicon & Deploy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Восстановить все удалённые API-роуты, создать favicon в терминальном стиле и задеплоить приложение на Vercel.

**Architecture:** Все API-роуты существуют в git HEAD — восстанавливаем `git checkout HEAD -- <file>`. Favicon создаём как `app/icon.svg` (Next.js App Router автоматически подхватывает). Деплой через Vercel CLI / MCP.

**Tech Stack:** Next.js 15 App Router, TypeScript, Prisma, Vercel

---

## Task 1: Восстановить удалённые API-роуты и app/page.tsx

**Files:**
- Restore: `app/page.tsx`
- Restore: `app/api/health/route.ts`
- Restore: `app/api/leaders/route.ts`
- Restore: `app/api/leaders/[id]/route.ts`
- Restore: `app/api/strategies/route.ts`
- Restore: `app/api/strategies/[id]/route.ts`
- Restore: `app/api/activity/route.ts`
- Restore: `app/api/demo/seed/route.ts`
- Restore: `app/api/demo/trade/route.ts`
- Restore: `app/api/execution/quote/route.ts`
- Restore: `app/api/execution/prepare/route.ts`
- Restore: `app/api/execution/submit/route.ts`
- Restore: `app/api/webhooks/ton/route.ts`

- [ ] **Step 1: Восстановить все файлы из HEAD одной командой**

```bash
git checkout HEAD -- \
  "app/page.tsx" \
  "app/api/health/route.ts" \
  "app/api/leaders/route.ts" \
  "app/api/leaders/[id]/route.ts" \
  "app/api/strategies/route.ts" \
  "app/api/strategies/[id]/route.ts" \
  "app/api/activity/route.ts" \
  "app/api/demo/seed/route.ts" \
  "app/api/demo/trade/route.ts" \
  "app/api/execution/quote/route.ts" \
  "app/api/execution/prepare/route.ts" \
  "app/api/execution/submit/route.ts" \
  "app/api/webhooks/ton/route.ts"
```

- [ ] **Step 2: Проверить, что файлы появились**

```bash
ls app/api/*/route.ts app/api/*/*/route.ts app/page.tsx
```

Ожидается: список всех 13 файлов без ошибок.

- [ ] **Step 3: Убедиться что сборка проходит**

```bash
npm run build 2>&1 | tail -20
```

Ожидается: `✓ Generating static pages` без ошибок компилятора.

---

## Task 2: Создать favicon в терминальном стиле

**Files:**
- Create: `app/icon.svg` — основная иконка (Next.js App Router)
- Create: `public/favicon.ico` — fallback (минимальный 16×16 ICO)

- [ ] **Step 1: Создать SVG-иконку**

Создать `app/icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" fill="#050e07"/>
  <!-- Mirror axis line -->
  <line x1="16" y1="4" x2="16" y2="28" stroke="#00ff66" stroke-width="1.5" opacity="0.6"/>
  <!-- Left arrow (YOU) -->
  <polyline points="6,16 12,10 12,22" fill="none" stroke="#00ff66" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <!-- Right arrow (LEADER) -->
  <polyline points="26,16 20,10 20,22" fill="none" stroke="#00ff66" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>
  <!-- Center dot -->
  <circle cx="16" cy="16" r="2" fill="#00ff66" opacity="0.9"/>
</svg>
```

- [ ] **Step 2: Проверить что Next.js подхватил иконку**

Открыть http://localhost:3000 в браузере, вкладка должна показывать зелёную иконку.

---

## Task 3: Финальная проверка перед деплоем

**Files:** нет изменений

- [ ] **Step 1: Запустить type-check**

```bash
npm run type-check 2>&1 | tail -10
```

Ожидается: без ошибок.

- [ ] **Step 2: Запустить build**

```bash
npm run build 2>&1 | tail -20
```

Ожидается: все роуты собраны, нет ошибок.

- [ ] **Step 3: Проверить dev-сервер вручную**

Открыть http://localhost:3000/api/health — должно вернуть `{"ok":true}`.

---

## Task 4: Деплой на Vercel

- [ ] **Step 1: Использовать vercel:deploy skill для деплоя на production**

Запустить skill `vercel:deploy` с аргументом `prod`.
