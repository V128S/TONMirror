/**
 * fetchWithRetry — thin fetch wrapper with a timeout and exponential backoff on
 * transient failures (network error, HTTP 429, HTTP 5xx). Honors `Retry-After`.
 *
 * Framework-agnostic (only the global fetch) so it's usable from both `modules/`
 * and `server/`. Keep it dumb: no domain logic here.
 */
export interface RetryOptions {
  /** Extra attempts after the first (so total tries = retries + 1). Default 2. */
  retries?: number;
  /** Base backoff in ms; doubles each attempt, with jitter. Default 300. */
  baseDelayMs?: number;
  /** Per-attempt abort timeout in ms. Default 10_000. */
  timeoutMs?: number;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function backoffMs(base: number, attempt: number, res?: Response): number {
  const retryAfter = res?.headers.get("retry-after");
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  }
  const exp = base * 2 ** attempt;
  return exp + Math.random() * base; // jitter
}

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  opts: RetryOptions = {},
): Promise<Response> {
  const { retries = 2, baseDelayMs = 300, timeoutMs = 10_000 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      let res: Response;
      try {
        res = await fetch(url, { ...init, signal: ctrl.signal });
      } finally {
        clearTimeout(timer);
      }

      if ((res.status === 429 || res.status >= 500) && attempt < retries) {
        await delay(backoffMs(baseDelayMs, attempt, res));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < retries) {
        await delay(backoffMs(baseDelayMs, attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}
