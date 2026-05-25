/**
 * Idempotent seed — safe to run multiple times.
 * Uses upsert throughout to avoid duplicates.
 */
import { PrismaClient, LeaderSourceType, TradeSourceProvider, TradeStatus, DecisionType, ExecutionStatus, StrategyMode } from "@prisma/client";

const prisma = new PrismaClient();

// ─── Token metadata ───────────────────────────────────────────────────────────

const TOKENS = [
  { symbol: "TON",  name: "Toncoin",     address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", decimals: 9,  isStable: false },
  { symbol: "USDT", name: "Tether USD",  address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", decimals: 6,  isStable: true  },
  { symbol: "STON", name: "STON",        address: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO", decimals: 9,  isStable: false },
  { symbol: "NOT",  name: "Notcoin",     address: "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT", decimals: 9,  isStable: false },
  { symbol: "DOGS", name: "Dogs",        address: "EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS", decimals: 0,  isStable: false },
];

// ─── Leader wallets ───────────────────────────────────────────────────────────

const LEADERS = [
  {
    nickname:      "Alpha Whale 🐋",
    address:       "UQBFkBuVMiIpBGLnIsYM9oFBbkJMFLnmHsVLFEGrElAlPHAL",
    tags:          ["high-frequency", "defi", "bluechip"],
    riskScore:     3,
    activityScore: 0.92,
    winRateApprox: 0.78,
    notes:         "Consistent performer, focuses on TON/USDT pairs. Good signal quality.",
    sourceType:    LeaderSourceType.seed,
  },
  {
    nickname:      "DeFi Degen 🎰",
    address:       "UQCbS3KJZMRQ5sX2S9R5U5rBGTc8xD7dMlJBFnKwqPRl_DGN",
    tags:          ["high-risk", "meme", "new-tokens"],
    riskScore:     8,
    activityScore: 0.85,
    winRateApprox: 0.51,
    notes:         "High activity, trades meme tokens. High risk, occasional big wins.",
    sourceType:    LeaderSourceType.seed,
  },
  {
    nickname:      "Steady Eddie 📈",
    address:       "UQDKmnbFFGfMj9p7mmhRJrPMD1ZuH0eHD4zSV8oTEhPsHedY",
    tags:          ["stable", "low-risk", "usdt-pairs"],
    riskScore:     2,
    activityScore: 0.45,
    winRateApprox: 0.69,
    notes:         "Conservative strategy. Stablecoin pairs only. Low frequency.",
    sourceType:    LeaderSourceType.seed,
  },
];

// ─── Demo user ────────────────────────────────────────────────────────────────

const DEMO_USER = {
  telegramId:  "demo_12345",
  username:    "demo_user",
  displayName: "Demo User",
  isDemo:      true,
};

// ─── Sample trades ────────────────────────────────────────────────────────────

function buildSampleTrades(leaderIds: Record<string, string>) {
  const now = Date.now();
  const hour = 3_600_000;

  return [
    // Alpha Whale — profitable TON→USDT
    {
      externalId:          "mock_trade_001",
      leaderWalletId:      leaderIds["Alpha Whale 🐋"],
      txHash:              "0xmock_alpha_001",
      timestamp:           new Date(now - 2 * hour),
      soldToken:           "TON",
      boughtToken:         "USDT",
      soldAmountDecimal:   120,
      boughtAmountDecimal: 738.6,
      usdEstimate:         738.6,
      dex:                 "ston.fi",
      status:              TradeStatus.processed,
      rawSourceJson:       { mock: true, tier: "alpha" },
      sourceProvider:      TradeSourceProvider.mock,
    },
    // Alpha Whale — buy STON
    {
      externalId:          "mock_trade_002",
      leaderWalletId:      leaderIds["Alpha Whale 🐋"],
      txHash:              "0xmock_alpha_002",
      timestamp:           new Date(now - 5 * hour),
      soldToken:           "USDT",
      boughtToken:         "STON",
      soldAmountDecimal:   500,
      boughtAmountDecimal: 14285,
      usdEstimate:         500,
      dex:                 "ston.fi",
      status:              TradeStatus.processed,
      rawSourceJson:       { mock: true, tier: "alpha" },
      sourceProvider:      TradeSourceProvider.mock,
    },
    // DeFi Degen — DOGS buy (meme / blocked token scenario)
    {
      externalId:          "mock_trade_003",
      leaderWalletId:      leaderIds["DeFi Degen 🎰"],
      txHash:              "0xmock_degen_001",
      timestamp:           new Date(now - 1 * hour),
      soldToken:           "TON",
      boughtToken:         "DOGS",
      soldAmountDecimal:   50,
      boughtAmountDecimal: 12_500_000,
      usdEstimate:         307.5,
      dex:                 "ston.fi",
      status:              TradeStatus.processed,
      rawSourceJson:       { mock: true, tier: "degen" },
      sourceProvider:      TradeSourceProvider.mock,
    },
    // Steady Eddie — safe USDT→TON
    {
      externalId:          "mock_trade_004",
      leaderWalletId:      leaderIds["Steady Eddie 📈"],
      txHash:              "0xmock_eddie_001",
      timestamp:           new Date(now - 12 * hour),
      soldToken:           "USDT",
      boughtToken:         "TON",
      soldAmountDecimal:   200,
      boughtAmountDecimal: 32.5,
      usdEstimate:         200,
      dex:                 "ston.fi",
      status:              TradeStatus.processed,
      rawSourceJson:       { mock: true, tier: "steady" },
      sourceProvider:      TradeSourceProvider.mock,
    },
  ];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...");

  // Tokens
  for (const token of TOKENS) {
    await prisma.tokenMetadata.upsert({
      where:  { symbol: token.symbol },
      update: token,
      create: token,
    });
  }
  console.log(`  ✓ ${TOKENS.length} tokens`);

  // Leaders
  const leaderIds: Record<string, string> = {};
  for (const leader of LEADERS) {
    const record = await prisma.leaderWallet.upsert({
      where:  { address: leader.address },
      update: { ...leader, isActive: true },
      create: { ...leader, isActive: true },
    });
    leaderIds[leader.nickname] = record.id;
  }
  console.log(`  ✓ ${LEADERS.length} leader wallets`);

  // Demo user
  const demoUser = await prisma.user.upsert({
    where:  { telegramId: DEMO_USER.telegramId },
    update: DEMO_USER,
    create: DEMO_USER,
  });
  console.log(`  ✓ demo user (id: ${demoUser.id})`);

  // Demo strategies (one per leader)
  const strategyDefs = [
    {
      leaderNickname:      "Alpha Whale 🐋",
      mode:                StrategyMode.fixed_amount,
      fixedAmount:         10,
      slippageBps:         100,
      allowedTokens:       [],
      blockedTokens:       [],
      copySells:           false,
      requireManualConfirm: true,
    },
    {
      leaderNickname:      "DeFi Degen 🎰",
      mode:                StrategyMode.fixed_amount,
      fixedAmount:         5,
      slippageBps:         200,
      allowedTokens:       [],
      blockedTokens:       ["DOGS", "NOT"],
      copySells:           false,
      requireManualConfirm: true,
    },
    {
      leaderNickname:      "Steady Eddie 📈",
      mode:                StrategyMode.percent_of_leader,
      percentOfLeader:     10,
      slippageBps:         50,
      allowedTokens:       ["TON", "USDT"],
      blockedTokens:       [],
      copySells:           true,
      requireManualConfirm: false,
    },
  ];

  for (const def of strategyDefs) {
    const { leaderNickname, ...data } = def;
    const leaderWalletId = leaderIds[leaderNickname];
    if (!leaderWalletId) continue;

    await prisma.followStrategy.upsert({
      where:  { userId_leaderWalletId: { userId: demoUser.id, leaderWalletId } },
      update: data,
      create: { userId: demoUser.id, leaderWalletId, ...data },
    });
  }
  console.log(`  ✓ ${strategyDefs.length} follow strategies`);

  // Trade events
  const trades = buildSampleTrades(leaderIds);
  let tradeCount = 0;
  for (const trade of trades) {
    await prisma.tradeEvent.upsert({
      where:  { externalId: trade.externalId },
      update: trade,
      create: trade,
    });
    tradeCount++;
  }
  console.log(`  ✓ ${tradeCount} trade events`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
