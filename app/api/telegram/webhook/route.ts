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
    const name   = msg.from?.first_name ?? "Трейдер";

    // ── /start ────────────────────────────────────────────────────────────────
    if (text.startsWith("/start")) {
      await sendMessage(chatId,
        `🔮 <b>Добро пожаловать в TonMirror, ${name}!</b>\n\n` +
        `Автоматическое копирование сделок лучших трейдеров TON blockchain.\n\n` +
        `<b>Что умеет приложение:</b>\n` +
        `🐋 Whale Scanner — находит прибыльных китов автоматически\n` +
        `⚡ Copy-trading — зеркалирует их сделки в реальном времени\n` +
        `🛡 Risk filters — защита от рискованных операций\n` +
        `📊 Portfolio — отслеживание PnL и активных стратегий\n\n` +
        `Нажми кнопку <b>Open App</b> в меню чата или кнопку ниже 👇`,
        {
          reply_markup: {
            inline_keyboard: [[
              {
                text:    "🔮 Открыть TonMirror",
                web_app: { url: APP_URL },
              },
            ], [
              {
                text: "🐋 Лидеры",
                web_app: { url: `${APP_URL}/leaders` },
              },
              {
                text: "📊 Портфель",
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
      await sendMessage(chatId, "🐋 <b>Топ-трейдеры TON</b>\n\nОткрой приложение чтобы просмотреть и начать копировать:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "🐋 Смотреть лидеров", web_app: { url: `${APP_URL}/leaders` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /portfolio ────────────────────────────────────────────────────────────
    if (text.startsWith("/portfolio")) {
      await sendMessage(chatId, "📊 <b>Твой портфель</b>\n\nАктивные стратегии и PnL:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "📊 Открыть портфель", web_app: { url: `${APP_URL}/portfolio` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /activity ─────────────────────────────────────────────────────────────
    if (text.startsWith("/activity")) {
      await sendMessage(chatId, "⚡ <b>Лента сделок</b>\n\nПоследние торговые сигналы и решения:", {
        reply_markup: {
          inline_keyboard: [[
            { text: "⚡ Лента активности", web_app: { url: `${APP_URL}/activity` } },
          ]],
        },
      });
      return NextResponse.json({ ok: true });
    }

    // ── /help ─────────────────────────────────────────────────────────────────
    if (text.startsWith("/help")) {
      await sendMessage(chatId,
        `❓ <b>Помощь по TonMirror</b>\n\n` +
        `/start — главная страница\n` +
        `/leaders — топ-трейдеры TON\n` +
        `/portfolio — твой портфель\n` +
        `/activity — лента сделок\n\n` +
        `<i>Нажми кнопку меню (кружок слева от ввода) чтобы сразу открыть приложение.</i>`,
      );
      return NextResponse.json({ ok: true });
    }

  } catch (err) {
    console.error("[telegram/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
