import { describe, it, expect } from "vitest";
import {
  toFriendlyAddress,
  shortenFriendly,
  looksRawAddress,
  isAddressLikeNickname,
  whaleAlias,
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

describe("isAddressLikeNickname", () => {
  it("flags raw, friendly, and shortened addresses; spares human names", () => {
    expect(isAddressLikeNickname(RAW)).toBe(true);
    expect(isAddressLikeNickname("UQD6…TcK9")).toBe(true);
    expect(isAddressLikeNickname("EQAbc123")).toBe(true);
    expect(isAddressLikeNickname("Alpha Whale")).toBe(false);
    expect(isAddressLikeNickname("Swift Orca")).toBe(false);
  });
});

describe("whaleAlias", () => {
  it("is deterministic and two words", () => {
    const a = whaleAlias(RAW);
    expect(a).toBe(whaleAlias(RAW));      // stable
    expect(a.split(" ")).toHaveLength(2); // "Adjective Creature"
  });

  it("varies across different seeds", () => {
    const aliases = new Set(["a", "b", "c", "d", "e"].map(whaleAlias));
    expect(aliases.size).toBeGreaterThan(1);
  });
});

describe("withFriendlyLeader", () => {
  it("converts the address and replaces a raw nickname with a stable alias", () => {
    const out = withFriendlyLeader({ address: RAW, nickname: "0:b113…1dfe", extra: 1 });
    expect(out.address.startsWith("UQ")).toBe(true);
    expect(out.nickname).toBe(whaleAlias(out.address));
    expect(out.extra).toBe(1); // preserves other fields
  });

  it("keeps a human nickname intact", () => {
    const out = withFriendlyLeader({ address: RAW, nickname: "Alpha Whale" });
    expect(out.nickname).toBe("Alpha Whale");
  });
});
