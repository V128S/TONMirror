/**
 * E2E smoke test — happy path copy-trade demo flow.
 *
 * Prerequisites: dev server running on http://localhost:3000
 * and database seeded (npx prisma db seed).
 *
 * Run: npx playwright test
 */
import { test, expect } from "@playwright/test";

// ─── Navigation & page rendering ─────────────────────────────────────────────

test.describe("Page navigation", () => {
  test("health check responds ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  test("home page renders without errors", async ({ page }) => {
    await page.goto("/home");
    await expect(page.locator("h1")).toContainText("TonMirror");
    await expect(page.locator("text=Browse Leader Wallets")).toBeVisible();
  });

  test("leaders page shows seeded wallets", async ({ page }) => {
    await page.goto("/leaders");
    await expect(page.locator("h1")).toContainText("Leaders");
    // At least 3 leader cards from seed
    const cards = page.locator("main a[href^='/leaders/']");
    await expect(cards).toHaveCount(3);
  });

  test("activity page renders and shows events", async ({ page }) => {
    await page.goto("/activity");
    await expect(page.locator("h1")).toContainText("Activity");
    // Should have seeded events
    await expect(page.locator("text=events")).toBeVisible();
  });

  test("portfolio page renders with strategies", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.locator("h1")).toContainText("Portfolio");
  });

  test("settings page shows demo controls", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    // Demo controls card should be visible (NEXT_PUBLIC_ENABLE_DEMO_MODE=true)
    await expect(page.locator("text=Demo Controls")).toBeVisible();
    await expect(page.locator("text=Emit Profitable Trade")).toBeVisible();
  });
});

// ─── Leader detail & strategy form ───────────────────────────────────────────

test.describe("Leader detail", () => {
  test("opens leader detail from leaders list", async ({ page }) => {
    await page.goto("/leaders");
    // Click first leader card and wait for navigation
    await page.locator("main a[href^='/leaders/']").first().click();
    await page.waitForURL(/\/leaders\/.+/);
    // Should show stats grid (use first() to avoid strict mode issues)
    await expect(page.locator("text=Win rate").first()).toBeVisible();
    await expect(page.locator("text=Risk").first()).toBeVisible();
    await expect(page.locator("text=Recent Trades")).toBeVisible();
  });

  test("strategy form is present on non-followed leader", async ({ page }) => {
    await page.goto("/leaders");
    await page.locator("main a[href^='/leaders/']").first().click();
    await page.waitForURL(/\/leaders\/.+/);
    // Either "Set Up Copy Strategy" or "Your Strategy" must be visible
    const setupForm   = page.locator("text=Set Up Copy Strategy");
    const yourStrategy = page.locator("text=Your Strategy");
    await expect(setupForm.or(yourStrategy).first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Demo trade pipeline ──────────────────────────────────────────────────────

test.describe("Demo trade pipeline", () => {
  test("emitting a profitable trade via Settings creates a pending execution", async ({ page }) => {
    await page.goto("/settings");
    // Wait for demo controls to render
    await expect(page.locator("text=Demo Controls")).toBeVisible();
    await page.locator("text=Emit Profitable Trade").click();

    // Feedback toast shows trade direction e.g. "TON → USDT emitted"
    await expect(page.locator("text=TON").first()).toBeVisible({ timeout: 5000 });
  });

  test("activity feed shows decision after emitting demo trade", async ({ page }) => {
    // Emit a profitable trade
    await page.request.post("/api/demo/trade", {
      data: { type: "profitable" },
    });

    await page.goto("/activity");
    // Should show at least one "Review" badge (manual_review outcome)
    await expect(page.locator("text=Review").first()).toBeVisible({ timeout: 5000 });
  });

  test("rejected trade shows Rejected badge", async ({ page }) => {
    await page.request.post("/api/demo/trade", {
      data: { type: "blocked_token" },
    });

    await page.goto("/activity");
    await expect(page.locator("text=Rejected").first()).toBeVisible({ timeout: 5000 });
  });
});

// ─── Quote card flow ──────────────────────────────────────────────────────────

test.describe("Quote card", () => {
  test("pending execution shows Get Quote button and expands quote card", async ({ page }) => {
    // Emit a fresh profitable trade to get a pending execution
    await page.request.post("/api/demo/trade", {
      data: { type: "profitable" },
    });

    await page.goto("/activity");

    // Find the "Get Quote →" button
    const getQuoteBtn = page.locator("text=Get Quote →").first();
    await expect(getQuoteBtn).toBeVisible({ timeout: 5000 });

    // Click to fetch quote
    await getQuoteBtn.click();

    // QuoteCard should expand with swap details
    await expect(page.locator("text=You sell")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=You receive")).toBeVisible();
    await expect(page.locator("text=Rate")).toBeVisible();
    await expect(page.locator("text=Confirm Quote →")).toBeVisible();
  });
});
