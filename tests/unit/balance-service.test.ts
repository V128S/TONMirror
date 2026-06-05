/**
 * Unit tests for balance.service.assertSufficientBalance()
 *
 * Mocks fetchWithRetry (TonAPI). Verifies it throws only on a confirmed
 * shortfall and stays silent (fail-open) when balances can't be fetched.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const { fetchWithRetry } = vi.hoisted(() => ({ fetchWithRetry: vi.fn() }));
vi.mock("@/lib/fetch-retry", () => ({ fetchWithRetry }));

import { assertSufficientBalance } from "@/server/services/balance.service";

const ADDR = "UQWalletAddr";

function tonResponse(nano: string) {
  return { ok: true, status: 200, json: async () => ({ balance: nano }) } as Response;
}
function jettonResponse(base: string) {
  return { ok: true, status: 200, json: async () => ({ balance: base }) } as Response;
}

/** Route fetch by URL: TON account vs jetton sub-resource. */
function routeFetch(impl: { ton?: Response; jetton?: Response }) {
  fetchWithRetry.mockImplementation(async (url: string) => {
    if (url.includes("/jettons/")) return impl.jetton ?? ({ ok: false, status: 500 } as Response);
    return impl.ton ?? ({ ok: false, status: 500 } as Response);
  });
}

describe("assertSufficientBalance — TON sold", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes when TON balance covers amount + gas", async () => {
    routeFetch({ ton: tonResponse("10000000000") }); // 10 TON
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "TON", amountInDecimal: 5 }),
    ).resolves.toBeUndefined();
  });

  it("throws when TON balance is below amount + gas", async () => {
    routeFetch({ ton: tonResponse("5100000000") }); // 5.1 TON, need 5 + 0.3
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "TON", amountInDecimal: 5 }),
    ).rejects.toThrow(/Insufficient TON/);
  });

  it("fails open when balance can't be fetched", async () => {
    routeFetch({ ton: { ok: false, status: 500 } as Response });
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "TON", amountInDecimal: 999 }),
    ).resolves.toBeUndefined();
  });
});

describe("assertSufficientBalance — jetton sold (USDT)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes when jetton balance and TON gas are sufficient", async () => {
    routeFetch({ ton: tonResponse("1000000000"), jetton: jettonResponse("50000000") }); // 1 TON, 50 USDT
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "USDT", amountInDecimal: 25 }),
    ).resolves.toBeUndefined();
  });

  it("throws when the jetton balance is short", async () => {
    routeFetch({ ton: tonResponse("1000000000"), jetton: jettonResponse("10000000") }); // 10 USDT, need 25
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "USDT", amountInDecimal: 25 }),
    ).rejects.toThrow(/Insufficient USDT/);
  });

  it("throws when there isn't enough TON for gas", async () => {
    routeFetch({ ton: tonResponse("100000000"), jetton: jettonResponse("99000000") }); // 0.1 TON < 0.3 gas
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "USDT", amountInDecimal: 25 }),
    ).rejects.toThrow(/Insufficient TON for gas/);
  });

  it("treats a 404 jetton wallet as zero balance", async () => {
    routeFetch({ ton: tonResponse("1000000000"), jetton: { ok: false, status: 404 } as Response });
    await expect(
      assertSufficientBalance({ walletAddress: ADDR, soldToken: "USDT", amountInDecimal: 25 }),
    ).rejects.toThrow(/Insufficient USDT/);
  });
});
