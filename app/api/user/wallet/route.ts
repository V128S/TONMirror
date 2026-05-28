import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  userId:        z.string().cuid(),
  address:       z.string().min(10).max(100),
  walletAppName: z.string().optional().nullable(),
});

/**
 * POST /api/user/wallet
 *
 * Upserts a WalletConnection for the user.
 * Called by usePersistWallet() when TON Connect connects.
 * Safe to call multiple times — fully idempotent.
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

    const { userId, address, walletAppName } = parsed.data;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Deactivate previous wallets for this user (one active at a time)
    await prisma.walletConnection.updateMany({
      where:  { userId, isActive: true, NOT: { address } },
      data:   { isActive: false },
    });

    // Upsert this wallet as active
    const wallet = await prisma.walletConnection.upsert({
      where:  { userId_address: { userId, address } },
      update: {
        isActive:      true,
        lastUsedAt:    new Date(),
        walletAppName: walletAppName ?? undefined,
      },
      create: {
        userId,
        address,
        walletAppName: walletAppName ?? undefined,
        isActive:      true,
        chain:         "TON",
      },
    });

    return NextResponse.json({ data: { id: wallet.id, address: wallet.address } });
  } catch (err) {
    console.error("[POST /api/user/wallet]", err);
    return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 });
  }
}
