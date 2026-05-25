import { NextResponse } from "next/server";
import { execSync } from "child_process";

/**
 * POST /api/demo/seed
 * Re-runs the Prisma seed script — idempotent, safe to call multiple times.
 * Only available in demo mode.
 */
export async function POST() {
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE !== "true") {
    return NextResponse.json({ error: "Demo mode is disabled" }, { status: 403 });
  }

  try {
    execSync("npx prisma db seed", {
      cwd:    process.cwd(),
      stdio:  "pipe",
      timeout: 30_000,
    });
    return NextResponse.json({ data: { ok: true, message: "Demo data reset to initial state" } });
  } catch (err) {
    console.error("[POST /api/demo/seed]", err);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
