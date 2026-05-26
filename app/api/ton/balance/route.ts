import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy for tonapi.io /v2/accounts/{address}.
 * Avoids CORS restrictions when fetching from the browser.
 * Uses TON_API_KEY (server-only, not NEXT_PUBLIC_) for higher rate limits.
 */
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address required" }, { status: 400 });
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = process.env.TON_API_KEY ?? process.env.NEXT_PUBLIC_TON_API_KEY ?? "";
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(
      `https://tonapi.io/v2/accounts/${encodeURIComponent(address)}`,
      { headers, next: { revalidate: 30 } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: `tonapi ${res.status}` }, { status: res.status });
    }

    const data = (await res.json()) as { balance: string | number };
    return NextResponse.json({ balance: String(data.balance) });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
