/**
 * Typed, validated environment variables.
 * Import this everywhere instead of using process.env directly.
 * Server vars are lazy-validated so the build step doesn't require DATABASE_URL.
 */
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL:                 z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_TONCONNECT_MANIFEST_URL: z.string().default("http://localhost:3000/tonconnect-manifest.json"),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:   z.string().default("tonmirror_bot"),
  NEXT_PUBLIC_ENABLE_DEMO_MODE:        z.string().default("true"),
  NEXT_PUBLIC_ENABLE_LIVE_SOURCE:      z.string().default("false"),
});

// Public env — evaluated at module load (safe for client + build)
export const publicEnv = publicEnvSchema.parse({
  NEXT_PUBLIC_APP_URL:                 process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_TONCONNECT_MANIFEST_URL: process.env.NEXT_PUBLIC_TONCONNECT_MANIFEST_URL,
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:   process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME,
  NEXT_PUBLIC_ENABLE_DEMO_MODE:        process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE,
  NEXT_PUBLIC_ENABLE_LIVE_SOURCE:      process.env.NEXT_PUBLIC_ENABLE_LIVE_SOURCE,
});

export const isDemoMode   = publicEnv.NEXT_PUBLIC_ENABLE_DEMO_MODE   === "true";
export const isLiveSource = publicEnv.NEXT_PUBLIC_ENABLE_LIVE_SOURCE === "true";

// Server env — validated lazily inside server components / API routes only.
// Never import `serverEnv` in client components.
export function getServerEnv() {
  return z.object({
    DATABASE_URL:       z.string().min(1, "DATABASE_URL is required"),
    TON_WEBHOOK_SECRET: z.string().min(1).default("dev_secret"),
    TON_API_KEY:        z.string().optional(),
    CRON_SECRET:        z.string().min(1).default("dev_cron_secret"),
    WHALE_MIN_SCORE:    z.coerce.number().min(0).max(1).default(0.3),
    WHALE_MAX_LEADERS:  z.coerce.number().int().positive().default(50),
  }).parse({
    DATABASE_URL:       process.env.DATABASE_URL,
    TON_WEBHOOK_SECRET: process.env.TON_WEBHOOK_SECRET,
    TON_API_KEY:        process.env.TON_API_KEY,
    CRON_SECRET:        process.env.CRON_SECRET,
    WHALE_MIN_SCORE:    process.env.WHALE_MIN_SCORE,
    WHALE_MAX_LEADERS:  process.env.WHALE_MAX_LEADERS,
  });
}
