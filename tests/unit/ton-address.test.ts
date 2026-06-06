import { describe, it, expect } from "vitest";
import {
  toFriendlyAddress,
  shortenFriendly,
  looksRawAddress,
  withFriendlyLeader,
} from "@/lib/ton-address";

// A real raw TON address (USD₮ jetton master), used purely as a parse fixture.
const RAW = "0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe";

describe("toFriendlyAddress", () => {
  it("converts a raw 0:… address to user-friendly UQ form", () => {
    const f = toFriendlyAddress(RAW);
    expect(f.startsWith("UQ")).toBe(true);
    expect(f).not.toContain(":");
    expect(f.length).toBe(48);
  });

  it("is idempotent on an already-friendly address", () => {
    const f = toFriendlyAddress(RAW);
    expect(toFriendlyAddress(f)).toBe(f);
  });

  it("returns the input unchanged when it can't be parsed", () => {
    expect(toFriendlyAddress("not-an-address")).toBe("not-an-address");
  });
});

describe("shortenFriendly", () => {
  it("shortens to friendly head…tail", () => {
    const s = shortenFriendly(RAW, 4);
    expect(s).toMatch(/^UQ..….{4}$/);
  });
});

describe("looksRawAddress", () => {
  it("detects raw addresses and raw-derived nicknames", () => {
    expect(looksRawAddress(RAW)).toBe(true);
    expect(looksRawAddress("0:fadf…b54d")).toBe(true);
    expect(looksRawAddress("UQAbc")).toBe(false);
    expect(looksRawAddress("Alpha Whale")).toBe(false);
  });
});

describe("withFriendlyLeader", () => {
  it("converts address and regenerates a raw nickname", () => {
    const out = withFriendlyLeader({ address: RAW, nickname: "0:b113…1dfe", extra: 1 });
    expect(out.address.startsWith("UQ")).toBe(true);
    expect(out.nickname).toMatch(/^UQ..…/);
    expect(out.extra).toBe(1); // preserves other fields
  });

  it("keeps a human nickname intact", () => {
    const out = withFriendlyLeader({ address: RAW, nickname: "Alpha Whale" });
    expect(out.nickname).toBe("Alpha Whale");
  });
});
