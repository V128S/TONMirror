import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyTelegramInitData } from "@/server/auth/telegram-auth";

const bodySchema = z.object({
  /** Telegram numeric user ID as a string */
  telegramId: z.string().min(1),
  firstName:  z.string().optional(),
  lastName:   z.string().optional(),
  username:   z.string().optional(),
});

/**
 * POST /api/user/init
 *
 * Called once on app load by useCurrentUser.
 * Creates or updates the User row for the current Telegram user.
 * Returns the DB user (including the CUID id used as userId in all other endpoints).
 *
 * Safe to call multiple times — fully idempotent (upsert).
 */
export async function POST(req: Request) {
  try {
    const body   = await req.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 422 },
      );
    }

    // Prefer the cryptographically-verified Telegram identity over the body —
    // real Telegram clients send signed initData; the body is only trusted in
    // the browser/dev fallback (mock user).
    const verified = verifyTelegramInitData(req.headers.get("x-telegram-init-data") ?? "");
    const telegramId = verified ? String(verified.id) : parsed.data.telegramId;
    const firstName  = verified?.first_name ?? parsed.data.firstName;
    const lastName   = verified?.last_name  ?? parsed.data.lastName;
    const username   = verified?.username   ?? parsed.data.username;
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ").trim() || null;

    // The mock user injected by TelegramProvider in browser has id=12345.
    // Real Telegram user IDs are > 100 000.  Flag small IDs as demo.
    const isDemo = Number(telegramId) < 100_000;

    const user = await prisma.user.upsert({
      where:  { telegramId },
      update: {
        username:    username    ?? undefined,
        displayName: displayName ?? undefined,
      },
      create: {
        telegramId,
        username,
        displayName,
        isDemo,
      },
    });

    return NextResponse.json({
      data: {
        id:          user.id,
        telegramId:  user.telegramId,
        username:    user.username,
        displayName: user.displayName,
        isDemo:      user.isDemo,
      },
    });
  } catch (err) {
    console.error("[POST /api/user/init]", err);
    return NextResponse.json({ error: "Failed to init user" }, { status: 500 });
  }
}
