-- CreateEnum
CREATE TYPE "StrategyMode" AS ENUM ('fixed_amount', 'percent_of_leader');

-- CreateEnum
CREATE TYPE "LeaderSourceType" AS ENUM ('seed', 'manual', 'imported');

-- CreateEnum
CREATE TYPE "TradeSourceProvider" AS ENUM ('mock', 'ton_webhook');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('pending', 'processed', 'failed');

-- CreateEnum
CREATE TYPE "DecisionType" AS ENUM ('accepted', 'rejected', 'manual_review');

-- CreateEnum
CREATE TYPE "ExecutionStatus" AS ENUM ('pending', 'quoted', 'ready', 'submitted', 'confirmed', 'failed', 'skipped');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramId" TEXT,
    "username" TEXT,
    "displayName" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramUserId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoUrl" TEXT,
    "languageCode" TEXT,
    "rawInitDataJson" TEXT,

    CONSTRAINT "TelegramProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "walletAppName" TEXT,
    "chain" TEXT NOT NULL DEFAULT 'TON',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "WalletConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaderWallet" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "tags" TEXT[],
    "riskScore" INTEGER NOT NULL DEFAULT 5,
    "activityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "winRateApprox" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sourceType" "LeaderSourceType" NOT NULL DEFAULT 'seed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowStrategy" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leaderWalletId" TEXT NOT NULL,
    "mode" "StrategyMode" NOT NULL DEFAULT 'fixed_amount',
    "fixedAmount" DOUBLE PRECISION,
    "percentOfLeader" DOUBLE PRECISION,
    "maxTradeSize" DOUBLE PRECISION,
    "slippageBps" INTEGER NOT NULL DEFAULT 100,
    "allowedTokens" TEXT[],
    "blockedTokens" TEXT[],
    "copySells" BOOLEAN NOT NULL DEFAULT false,
    "dailyMaxSpend" DOUBLE PRECISION,
    "requireManualConfirm" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowStrategy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeEvent" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "leaderWalletId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "soldToken" TEXT NOT NULL,
    "boughtToken" TEXT NOT NULL,
    "soldAmountDecimal" DOUBLE PRECISION NOT NULL,
    "boughtAmountDecimal" DOUBLE PRECISION NOT NULL,
    "usdEstimate" DOUBLE PRECISION,
    "dex" TEXT NOT NULL DEFAULT 'ston.fi',
    "status" "TradeStatus" NOT NULL DEFAULT 'pending',
    "rawSourceJson" JSONB NOT NULL,
    "sourceProvider" "TradeSourceProvider" NOT NULL DEFAULT 'mock',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopyDecision" (
    "id" TEXT NOT NULL,
    "tradeEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "decision" "DecisionType" NOT NULL,
    "reason" TEXT NOT NULL,
    "plannedSoldToken" TEXT NOT NULL,
    "plannedBoughtToken" TEXT NOT NULL,
    "plannedAmountDecimal" DOUBLE PRECISION,
    "estimatedSlippageBps" INTEGER,
    "riskFlags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CopyDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CopyExecution" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ExecutionStatus" NOT NULL DEFAULT 'pending',
    "quoteId" TEXT,
    "routeJson" JSONB,
    "estimatedOut" DOUBLE PRECISION,
    "txHash" TEXT,
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CopyExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenMetadata" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 9,
    "isStable" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "iconUrl" TEXT,

    CONSTRAINT "TokenMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramProfile_userId_key" ON "TelegramProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramProfile_telegramUserId_key" ON "TelegramProfile"("telegramUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletConnection_userId_address_key" ON "WalletConnection"("userId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderWallet_address_key" ON "LeaderWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "FollowStrategy_userId_leaderWalletId_key" ON "FollowStrategy"("userId", "leaderWalletId");

-- CreateIndex
CREATE UNIQUE INDEX "TradeEvent_externalId_key" ON "TradeEvent"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenMetadata_symbol_key" ON "TokenMetadata"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "TokenMetadata_address_key" ON "TokenMetadata"("address");

-- AddForeignKey
ALTER TABLE "TelegramProfile" ADD CONSTRAINT "TelegramProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletConnection" ADD CONSTRAINT "WalletConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowStrategy" ADD CONSTRAINT "FollowStrategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowStrategy" ADD CONSTRAINT "FollowStrategy_leaderWalletId_fkey" FOREIGN KEY ("leaderWalletId") REFERENCES "LeaderWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeEvent" ADD CONSTRAINT "TradeEvent_leaderWalletId_fkey" FOREIGN KEY ("leaderWalletId") REFERENCES "LeaderWallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyDecision" ADD CONSTRAINT "CopyDecision_tradeEventId_fkey" FOREIGN KEY ("tradeEventId") REFERENCES "TradeEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyDecision" ADD CONSTRAINT "CopyDecision_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyDecision" ADD CONSTRAINT "CopyDecision_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "FollowStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyExecution" ADD CONSTRAINT "CopyExecution_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "CopyDecision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CopyExecution" ADD CONSTRAINT "CopyExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
