/**
 * TelegramNotifyService — sends Bot API messages to users.
 *
 * Called by DecisionService after each CopyDecision is written.
 * Uses TELEGRAM_BOT_TOKEN (server-only, never NEXT_PUBLIC_).
 *
 * Never throws — all errors are caught and logged.
 * Silent when BOT_TOKEN is not set (dev / CI environment).
 */

import { prisma } from "@/lib/prisma";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? "https://tonmirror.vercel.app";

// is_fullscreen: true (Bot API 8.0) — Mini App opens directly fullscreen, no half-screen peek
function webApp(path = "") {
  return { url: `${APP_URL}${path}`, is_fullscreen: true };
}

// ─── Telegram API helper ──────────────────────────────────────────────────────

async function sendMessage(
  chatId:  number | string,
  text:    string,
  extra:   Record<string, unknown> = {},
): Promise<void> {
  if (!BOT_TOKEN) return; // silently skip in dev
  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        chat_id:    chatId,
        text,
        parse_mode: "HTML",
        ...extra,
      }),
    });
  } catch (err) {
    console.warn("[TelegramNotify] sendMessage failed:", err);
  }
}

// ─── Public interface ─────────────────────────────────────────────────────────

export type NotifyDecisionInput = {
  userId:              string;    // DB CUID
  outcome:             "accepted" | "rejected" | "manual_review";
  leaderNickname:      string;
  soldToken:           string;
  boughtToken:         string;
  plannedAmountDecimal: number | null;
  executionId?:        string;    // present when execution was created
  riskFlags:           string[];
};

/**
 * Sends a Telegram message to the user for relevant trade decisions.
 *
 * - manual_review  → urgent notification with deep-link to approve
 * - accepted (auto) → informational notice
 * - rejected        → only if there are risk flags worth surfacing
 */
export const telegramNotifyService = {
  async notifyDecision(input: NotifyDecisionInput): Promise<void> {
    // Look up the user's telegramId
    let telegramId: string | null;
    try {
      const user = await prisma.user.findUnique({
        where:  { id: input.userId },
        select: { telegramId: true },
      });
      telegramId = user?.telegramId ?? null;
    } catch (err) {
      console.warn("[TelegramNotify] user lookup failed:", err);
      return;
    }

    if (!telegramId) return; // no Telegram ID on record

    const amount = input.plannedAmountDecimal != null
      ? `$${input.plannedAmountDecimal.toFixed(2)}`
      : "";

    const tradeDesc = `${amount} ${input.soldToken} → ${input.boughtToken}`;
    const leaderTag = `<b>${input.leaderNickname}</b>`;

    if (input.outcome === "manual_review") {
      // Urgent — requires user action
      const riskLine = input.riskFlags.length > 0
        ? `\n⚠️ Flags: ${input.riskFlags.map((f) => f.replace(/_/g, " ")).join(", ")}`
        : "";

      await sendMessage(
        telegramId,
        `🔔 <b>Trade needs your review</b>\n\n` +
        `${leaderTag} wants to swap ${tradeDesc}${riskLine}\n\n` +
        `Open TonMirror to approve or reject:`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "🔮 Review trade", web_app: webApp("/activity") },
            ]],
          },
        },
      );
      return;
    }

    if (input.outcome === "accepted") {
      await sendMessage(
        telegramId,
        `✅ <b>Auto-copied trade</b>\n\n` +
        `${leaderTag}: ${tradeDesc}\n\n` +
        `<i>Execution in progress — check Activity for details.</i>`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: "📊 View Activity", web_app: webApp("/activity") },
            ]],
          },
        },
      );
      return;
    }

    // rejected with risk flags — optional notice
    if (input.outcome === "rejected" && input.riskFlags.length > 0) {
      await sendMessage(
        telegramId,
        `🚫 <b>Trade blocked</b>\n\n` +
        `${leaderTag}: ${tradeDesc}\n` +
        `Reason: ${input.riskFlags.map((f) => f.replace(/_/g, " ")).join(", ")}`,
      );
    }
  },
};
