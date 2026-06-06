/**
 * Next.js Edge Middleware — injects Telegram Mini App init script
 * into the actual HTML <head> BEFORE any JavaScript executes.
 *
 * WHY this is needed:
 *   In Next.js App Router every JSX node — including <head> children and
 *   next/script with strategy="beforeInteractive" — is serialised into the
 *   RSC streaming payload and executed only after React hydration (~same
 *   timing as useEffect).  That is too late: Telegram may reveal the Mini
 *   App at half-screen before expand()+ready() fire.
 *
 *   The ONLY way to get code into the real HTML shell is to intercept the
 *   streamed response in middleware and patch it in-flight.
 *
 * HOW it works (avoids infinite loop):
 *   1. Request arrives → middleware adds X-TG-Inject-Skip header → fetches self.
 *   2. Second invocation sees the header → passes through to Next.js directly.
 *   3. Next.js HTML streams back to the first invocation.
 *   4. First invocation injects <script src="/tg-init.js"> before </head>.
 *   5. Patched HTML is returned to the browser.
 *
 *   Extra latency: one intra-Vercel round trip (<5 ms on the same PoP).
 *   Only fires for text/html GET requests (pages) — assets/API are untouched.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Scripts to inject into <head>, in order (synchronous, so each finishes before
 * the next runs):
 *   1. Official Telegram WebApp SDK — without it window.Telegram.WebApp lacks
 *      Bot API 8.0 methods like requestFullscreen(), so the app only expand()s
 *      to the large detent instead of going fullscreen.
 *   2. tg-init.js — expand() → requestFullscreen() → ready() before hydration.
 */
const INJECT =
  `<script src="https://telegram.org/js/telegram-web-app.js"></script>` +
  `<script src="/tg-init.js"></script>`;

/** Header used to break the self-fetch loop */
const SKIP = "x-middleware-tg-skip";

export const config = {
  matcher: [
    /*
     * Match all page routes.
     * Skip: _next/static, _next/image, /api/*, favicon.ico, and any path
     * that looks like a static file (has a file extension).
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/)(?!.*\\.[a-zA-Z0-9]+$).*)",
  ],
};

export async function middleware(req: NextRequest) {
  // ── Step 2: second invocation — pass through immediately ─────────────────
  if (req.headers.get(SKIP)) {
    return NextResponse.next();
  }

  // Only transform HTML document requests (pages, not XHR / prefetch / assets)
  const accept = req.headers.get("accept") ?? "";
  if (!accept.includes("text/html")) {
    return NextResponse.next();
  }

  // ── Step 1: fetch self with skip header to get the page HTML ─────────────
  const upstreamHeaders = new Headers(req.headers);
  upstreamHeaders.set(SKIP, "1");

  let upstream: Response;
  try {
    upstream = await fetch(req.url, {
      method:   req.method,
      headers:  upstreamHeaders,
      // Do not forward a body for GET/HEAD; avoid "body used already" errors
      body:     req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      redirect: "follow",
    });
  } catch {
    // If the self-fetch fails for any reason, fall back to normal routing
    return NextResponse.next();
  }

  // Only transform HTML responses; pass everything else through
  const ct = upstream.headers.get("content-type") ?? "";
  if (!upstream.body || !ct.includes("text/html")) {
    return new NextResponse(upstream.body, {
      status:  upstream.status,
      headers: upstream.headers,
    });
  }

  // ── Step 4: stream-transform — inject before </head> ─────────────────────
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let injected = false;
  // Small rolling buffer in case </head> spans two chunks (rare but possible)
  let buf = "";

  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Once injected, forward chunks unchanged
      if (injected) {
        controller.enqueue(chunk);
        return;
      }

      buf += decoder.decode(chunk, { stream: true });

      const idx = buf.indexOf("</head>");
      if (idx !== -1) {
        // Patch: insert script just before </head>
        const patched = buf.slice(0, idx) + INJECT + buf.slice(idx);
        controller.enqueue(encoder.encode(patched));
        buf = "";
        injected = true;
      }
      // If </head> not yet seen, keep buffering.
      // The HTML shell (which contains </head>) always arrives in the first
      // streamed chunk from Next.js, so this should resolve on the first call.
    },

    flush(controller) {
      // Flush any remaining buffered bytes (handles edge case where </head>
      // was never found — e.g., non-page HTML responses that slipped through)
      const tail = buf + decoder.decode(undefined, { stream: false });
      if (tail) {
        controller.enqueue(encoder.encode(tail));
      }
    },
  });

  // ── Step 5: return transformed response ──────────────────────────────────
  const responseHeaders = new Headers(upstream.headers);
  // Content-Length would be wrong after injection — remove it so the
  // browser uses chunked transfer encoding instead of cutting the body short.
  responseHeaders.delete("content-length");

  return new NextResponse(upstream.body.pipeThrough(transform), {
    status:     upstream.status,
    statusText: upstream.statusText,
    headers:    responseHeaders,
  });
}
