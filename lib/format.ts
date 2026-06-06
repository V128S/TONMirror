/**
 * All number/token/date formatting lives here.
 * Never use toFixed() or Intl directly in JSX.
 */

/** Format a token amount with up to `decimals` significant decimal places */
export function formatAmount(value: number, decimals = 4): string {
  if (value === 0) return "0";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(2)}K`;
  if (value < 0.0001)     return value.toExponential(2);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

/** Format a USD value */
export function formatUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(2)}K`;
  return new Intl.NumberFormat("en-US", {
    style:                 "currency",
    currency:              "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a signed USD PnL value, e.g. "+$1.20K", "-$340.00", "$0.00". */
export function formatPnlUsd(value: number): string {
  if (value === 0) return formatUsd(0);
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

/** Format a signed ratio (e.g. 0.12 → "+12%", -0.05 → "-5%"). */
export function formatSignedPercent(value: number, decimals = 0): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${(Math.abs(value) * 100).toFixed(decimals)}%`;
}

/** Format basis points as a percentage string */
export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/** Format a percentage (0–1) as "78%" */
export function formatPercent(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/** Shorten a TON wallet address */
export function shortenAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/** Relative time ("2h ago", "just now") */
export function formatRelativeTime(date: Date | string): string {
  const d    = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const sec  = Math.floor(diff / 1000);
  if (sec < 60)        return "just now";
  if (sec < 3600)      return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400)     return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
