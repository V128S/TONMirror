/**
 * TON address formatting helpers.
 *
 * On-chain sources (TonAPI, STON.fi events) hand back raw addresses like
 * `0:fadfb8…b54d`, but users expect the user-friendly form (`UQ…` / `EQ…`).
 * These helpers normalize either form to the friendly representation.
 *
 * Server-only by convention (pulls in @ton/core) — call these at the data
 * boundary (API routes, discovery) so clients receive friendly strings and
 * @ton/core never ships in the browser bundle.
 */
import { Address } from "@ton/core";

/**
 * Normalize any TON address (raw `0:hex` or already-friendly) to the
 * user-friendly, url-safe form. Wallets default to non-bounceable (`UQ…`),
 * matching how wallet apps display user accounts. Returns the input unchanged
 * if it can't be parsed.
 */
export function toFriendlyAddress(input: string, bounceable = false): string {
  try {
    return Address.parse(input).toString({ urlSafe: true, bounceable });
  } catch {
    return input;
  }
}

/** Friendly address, shortened for chips/overlines, e.g. `UQAb…cd12`. */
export function shortenFriendly(input: string, chars = 4): string {
  const friendly = toFriendlyAddress(input);
  if (friendly.length <= chars * 2 + 1) return friendly;
  return `${friendly.slice(0, chars)}…${friendly.slice(-chars)}`;
}

/** True when a string is (or starts as) a raw `0:…` address. */
export function looksRawAddress(s: string): boolean {
  return /^0:[0-9a-fA-F]+/.test(s) || /^0:/.test(s);
}

/**
 * Map a leader-ish row's display fields to friendly form. Converts `address`
 * and regenerates `nickname` from the address when the stored nickname is just
 * a raw address (legacy whale-discovery rows).
 */
export function withFriendlyLeader<T extends { address: string; nickname: string }>(
  leader: T,
): T {
  const address  = toFriendlyAddress(leader.address);
  const nickname = looksRawAddress(leader.nickname) ? shortenFriendly(leader.address) : leader.nickname;
  return { ...leader, address, nickname };
}
