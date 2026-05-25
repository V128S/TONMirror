import { NextResponse } from "next/server";

/**
 * POST /api/execution/submit
 *
 * TODO (Phase 3): receive signedBoc from TON Connect, broadcast on-chain,
 * update CopyExecution status to submitted/confirmed.
 *
 * Currently returns a clear 501 stub so the UI can handle it gracefully.
 */
export async function POST() {
  return NextResponse.json(
    {
      error:   "Not yet implemented",
      message: "Phase 3: broadcast signedBoc via TON Connect provider",
    },
    { status: 501 },
  );
}
