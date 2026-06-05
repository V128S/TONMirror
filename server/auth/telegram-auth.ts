/**
 * Telegram Mini App auth — verifies the signed `initData` the client passes so
 * the server can trust *who* is calling instead of believing a client-supplied
 * id. Verification follows the Telegram WebApp spec:
 *
 *   secret_key       = HMAC_SHA256(key="WebAppData", msg=bot_token)
 *   data_check_string= sorted "key=value" lines (excluding `hash`), \n-joined
 *   valid            = HMAC_SHA256(key=secret_key, msg=data_check_string) == hash
 *
 * Server-only — never import in client components.
 */
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

export interface TgInitUser {
  id: number;
  first_name?: string;
  last_name?:  string;
  username?:   string;
}

/**
 * Returns the authenticated Telegram user when `initData` is genuine and fresh,
 * otherwise null. `maxAgeSec = 0` disables the freshness check.
 */
export function verifyTelegramInitData(
  initData: string,
  botToken: string | undefined = process.env.TELEGRAM_BOT_TOKEN,
  maxAgeSec = 86_400,
): TgInitUser | null {
  if (!botToken || !initData) return null;
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get("hash");
    if (!hash) return null;
    params.delete("hash");

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join("\n");

    const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
    const computed  = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    if (computed !== hash) return null;

    const authDate = Number(params.get("auth_date") ?? 0);
    if (maxAgeSec > 0 && authDate > 0 && Date.now() / 1000 - authDate > maxAgeSec) return null;

    const userRaw = params.get("user");
    if (!userRaw) return null;
    const user = JSON.parse(userRaw) as TgInitUser;
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

/**
 * Resolves the calling user's DB id from a verified `x-telegram-init-data`
 * header, upserting the User row. Returns null when no valid initData is present
 * (browser/dev/demo) so callers can fall back to their existing behavior — real
 * Telegram clients always send initData, so this scopes them to their true id.
 */
export async function resolveAuthUserId(req: Request): Promise<string | null> {
  const initData = req.headers.get("x-telegram-init-data");
  if (!initData) return null;

  const tgUser = verifyTelegramInitData(initData);
  if (!tgUser) return null;

  const telegramId  = String(tgUser.id);
  const displayName =
    [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ").trim() || null;

  const user = await prisma.user.upsert({
    where:  { telegramId },
    update: { username: tgUser.username ?? undefined, displayName: displayName ?? undefined },
    create: {
      telegramId,
      username:    tgUser.username ?? null,
      displayName,
      isDemo:      Number(telegramId) < 100_000,
    },
  });
  return user.id;
}
