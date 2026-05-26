/**
 * POST /api/telegram/webhook
 *
 * Handles incoming Telegram bot updates.
 * Responds to /start with a welcome message + web_app button.
 * Responds to /leaders, /portfolio, /activity with deep-links.
 */

import { NextResponse, type NextRequest } from "next/server";

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://tonmirror.vercel.app";
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";

async function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message?: {
        chat:    { id: number };
        from?:   { first_name?: string };
        text?:   string;
      };
    };

    const msg  = body.message;
    if (!msg) return NextResponse.json({ ok: true });

    const chatId = msg.chat.id;
    const text   = msg.text ?? "";
    const name   = msg.from?.first_name ?? "Trader";

    // ── /start ────────────────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      await sendMessage(chatId,
        `🔮 <b>Welcome to TonMirror, ${name}!</b>\n\n` +
        `Automated copy-trading for the TON blockchain.\n\n` +
        `<b>What it does:</b>\n` +
        `🐋 Whale Scanner — automatically finds profitable wallets\n` +
        `⚡ Copy-trading — mirrors their trades in real time\n` +
        `🛡 Risk filters — protection against high-risk operations\n` +
        `📊 Portfolio — track PnL and active strategies\n\n` +
        `Tap <b>Open App</b> in the chat menu or use the button below 👇`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text:    "🔮 Open TonMirror",
                web_app: { url: APP_URL },
              },
            ], [
              {
                text: "🐋 Leaders",
                web_app: { url: `${APP_URL}/leaders` },
              },
              {
                text: "📊 Portfolio",
                web_app: { url: `${APP_URL}/portfolio` },
              },
            ]],
          },
        },
      );
      return NextResponse.json({ ok: true });
    }

    // ── /leaders ──────────────────────────────────────────────────────────────
    if (text.startsWith("/leaders")) {
      await sendMessage(chatId, "🐋 <b>Top TON traders</b>\n\nOpen the app to browse and start copying:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "🐋 Browse leaders", web_app: { url: `${APP_URL}/leaders` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /portfolio ────────────────────────────────────────────────────────────
    if (text.startsWith("/portfolio")) {
      await sendMessage(chatId, "📊 <b>Your portfolio</b>\n\nActive strategies and PnL:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "📊 Open portfolio", web_app: { url: `${APP_URL}/portfolio` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /activity ─────────────────────────────────────────────────────────────
    if (text.startsWith("/activity")) {
      await sendMessage(chatId, "⚡ <b>Trade feed</b>\n\nLatest trading signals and decisions:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "⚡ Activity feed", web_app: { url: `${APP_URL}/activity` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /help ─────────────────────────────────────────────────────────────────
    if (text.startsWith("/help")) {
      await sendMessage(chatId,
        `❓ <b>TonMirror Help</b>\n\n` +
        `/start — home page\n` +
        `/leaders — top TON traders\n` +
        `/portfolio — your portfolio\n` +
        `/activity — trade feed\n\n` +
        `<i>Tap the menu button (circle left of input) to open the app directly.</i>`,
      );
      return NextResponse.json({ ok: true });
    }

  } catch (err) {
    console.error("[telegram/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
