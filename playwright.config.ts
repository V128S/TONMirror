import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    // Mobile viewport — TonMirror is a Telegram Mini App
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],  // Android device — uses Chromium
      },
    },
  ],
  // Dev server must be started externally before running e2e tests
  // (pnpm dev or npm run dev)
});
