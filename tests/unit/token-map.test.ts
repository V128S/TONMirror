import { describe, it, expect } from "vitest";
import {
  isSupportedPair,
  getTokenInfo,
  toBaseUnits,
  fromBaseUnits,
} from "@/modules/omniston/token-map";

describe("token-map supported pairs", () => {
  it("accepts the three vetted directed pairs", () => {
    expect(isSupportedPair("TON", "USDT")).toBe(true);
    expect(isSupportedPair("USDT", "TON")).toBe(true);
    expect(isSupportedPair("tsTON", "USDT")).toBe(true);
  });

  it("is case-insensitive (tsTON / TSTON)", () => {
    expect(isSupportedPair("tston", "usdt")).toBe(true);
    expect(isSupportedPair("TSTON", "USDT")).toBe(true);
  });

  it("rejects unlisted directions and unknown tokens", () => {
    expect(isSupportedPair("USDT", "TSTON")).toBe(false); // reverse not listed
    expect(isSupportedPair("TSTON", "TON")).toBe(false);  // not listed
    expect(isSupportedPair("TON", "NOT")).toBe(false);    // unvetted token
    expect(isSupportedPair("DOGS", "TON")).toBe(false);
  });
});

describe("token-map getTokenInfo", () => {
  it("resolves the live universe with correct decimals", () => {
    expect(getTokenInfo("TON")?.decimals).toBe(9);
    expect(getTokenInfo("USDT")?.decimals).toBe(6);
    expect(getTokenInfo("tsTON")?.decimals).toBe(9);
  });

  it("returns undefined for tokens outside the universe", () => {
    expect(getTokenInfo("NOT")).toBeUndefined();
    expect(getTokenInfo("DOGS")).toBeUndefined();
  });
});

describe("token-map toBaseUnits", () => {
  it("converts without float drift at 9 decimals", () => {
    expect(toBaseUnits(1.234567891, 9)).toBe("1234567891");
    expect(toBaseUnits(1, 9)).toBe("1000000000");
    expect(toBaseUnits(0.000000001, 9)).toBe("1");
  });

  it("converts USDT (6 decimals) correctly", () => {
    expect(toBaseUnits(10, 6)).toBe("10000000");
    expect(toBaseUnits(0.5, 6)).toBe("500000");
  });

  it("clamps invalid input to zero", () => {
    expect(toBaseUnits(-5, 9)).toBe("0");
    expect(toBaseUnits(Number.NaN, 9)).toBe("0");
  });

  it("round-trips through fromBaseUnits", () => {
    expect(fromBaseUnits(toBaseUnits(12.5, 6), 6)).toBeCloseTo(12.5, 6);
  });
});
